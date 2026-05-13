import os
from pathlib import Path
from dotenv import load_dotenv
from github import Github

from backend.github_poster import post_general_comment
from backend.llm_client import call_llama

load_dotenv(dotenv_path=Path(__file__).resolve().parents[1] / ".env")

g = Github(os.getenv("GITHUB_TOKEN"))
BOT_COMMENT_MARKER = "<!-- code-reviewer-bot -->"


def get_last_bot_comment(repo_name: str, pr_number: int) -> str:
    repo = g.get_repo(repo_name)
    pr = repo.get_pull(pr_number)
    bot_name = os.getenv("BOT_NAME", "")
    comments = list(pr.get_issue_comments()) + list(pr.get_review_comments())
    for comment in reversed(comments):
        body = getattr(comment, "body", "") or ""
        user = getattr(getattr(comment, "user", None), "login", "")
        if "Code Reviewer" in body or (bot_name and user == bot_name):
            return body
    return "Original AI comment not found."


def get_relevant_code(repo_name: str, pr_number: int) -> str:
    repo = g.get_repo(repo_name)
    pr = repo.get_pull(pr_number)
    return "".join(f"\nFile: {f.filename}\n{(f.patch or '')[:500]}\n" for f in pr.get_files())


def run(repo_name: str, pr_number: int, dev_reply: str, commenter: str) -> dict:
    bot_name = os.getenv("BOT_NAME", "").strip().lower()
    normalized_commenter = commenter.strip().lower()
    if (
        (bot_name and normalized_commenter == bot_name)
        or normalized_commenter.endswith("[bot]")
        or BOT_COMMENT_MARKER in dev_reply
        or "**Code Reviewer" in dev_reply
    ):
        return {"decision": "ignored"}

    original = get_last_bot_comment(repo_name, pr_number)
    code = get_relevant_code(repo_name, pr_number)

    prompt = f"""You are a code reviewer in a debate.
Original AI comment: {original[:800]}
Developer reply: {dev_reply[:800]}
Relevant code: {code[:1000]}

Start your response with EXACTLY one word: CONCEDE, MAINTAIN, or ESCALATE.
Then explain your reasoning in 2 sentences.
- CONCEDE if the developer makes a valid point and the original concern was wrong
- MAINTAIN if the concern still stands
- ESCALATE if a human reviewer should decide"""

    response = call_llama(prompt)
    decision = "MAINTAIN"
    if response.upper().startswith("CONCEDE"):
        decision = "CONCEDE"
    elif response.upper().startswith("ESCALATE"):
        decision = "ESCALATE"

    human = os.getenv("HUMAN_REVIEWER", "").strip()
    mention = f"\n\n@{human} please take a look." if decision == "ESCALATE" and human else ""
    reply = f"**Code Reviewer - {decision}**\n\n{response}{mention}"
    post_general_comment(repo_name, pr_number, reply)
    return {"decision": decision, "response": response}
