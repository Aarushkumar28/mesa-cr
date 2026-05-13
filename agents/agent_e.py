import os
from pathlib import Path
from dotenv import load_dotenv
from github import Github

from backend.github_poster import post_general_comment
from backend.llm_client import call_llama
from storage.database import save_conflict

load_dotenv(dotenv_path=Path(__file__).resolve().parents[1] / ".env")

g = Github(os.getenv("GITHUB_TOKEN"))


def get_open_prs(repo_name: str, exclude_pr: int) -> list:
    repo = g.get_repo(repo_name)
    open_prs = []
    for pr in repo.get_pulls(state="open"):
        if pr.number == exclude_pr:
            continue
        files = list(pr.get_files())
        open_prs.append({
            "number": pr.number,
            "author": pr.user.login,
            "files": [f.filename for f in files],
            "title": pr.title,
            "diff": "".join(f"\nFile: {f.filename}\n{f.patch or ''}\n" for f in files),
        })
    return open_prs


def run(repo_name: str, new_pr_number: int, new_pr_files: list, new_diff: str) -> dict:
    open_prs = get_open_prs(repo_name, new_pr_number)
    confirmed_conflicts = []

    for pr in open_prs:
        overlap = sorted(set(new_pr_files) & set(pr["files"]))
        if not overlap:
            continue

        prompt = f"""Compare two open pull requests for merge conflicts.
Shared files: {overlap}
New PR changes: {new_diff[:600]}
Other PR title: {pr['title']}
Other PR changes: {pr.get('diff', '')[:600]}

Are these changes logically incompatible in the shared files above? Answer YES or NO in one sentence."""

        answer = call_llama(prompt)
        if not answer.upper().strip().startswith("YES"):
            continue

        confirmed_conflicts.append(pr)
        is_new_conflict = save_conflict(repo_name, new_pr_number, pr["number"], overlap, answer)
        if not is_new_conflict:
            continue

        overlap_text = ", ".join(overlap)
        msg_new = (
            "**Inter-PR Conflict Detected**\n"
            f"This PR may conflict with **PR #{pr['number']}** by @{pr['author']}.\n"
            f"**Overlap / reason:** {overlap_text}\n"
            f"**Semantic check:** {answer}\n"
            f"Please coordinate with @{pr['author']} before merging."
        )
        msg_other = (
            f"**PR #{new_pr_number}** may conflict with this PR.\n"
            f"**Overlap / reason:** {overlap_text}\n"
            "Please coordinate before merging."
        )
        post_general_comment(repo_name, new_pr_number, msg_new)
        post_general_comment(repo_name, pr["number"], msg_other)

    return {"conflicts_found": [p["number"] for p in confirmed_conflicts]}
