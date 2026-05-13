import os
from pathlib import Path
from dotenv import load_dotenv
from github import Github

load_dotenv(dotenv_path=Path(__file__).resolve().parents[1] / ".env")

g = Github(os.getenv("GITHUB_TOKEN"))
BOT_COMMENT_MARKER = "<!-- code-reviewer-bot -->"


def _tag_bot_comment(message: str) -> str:
    if BOT_COMMENT_MARKER in message:
        return message
    return f"{BOT_COMMENT_MARKER}\n{message}"


def post_review_comments(repo_name: str, pr_number: int, comments: list):
    repo = g.get_repo(repo_name)
    pr = repo.get_pull(pr_number)

    if not comments:
        pr.create_issue_comment(_tag_bot_comment("**Code Reviewer:** No major issues found."))
        return

    commit = list(pr.get_commits())[-1]
    for item in comments:
        text = (
            "**Code Reviewer**\n"
            f"**Severity:** {item.get('severity', 'medium').upper()} | "
            f"**Category:** {item.get('category', 'general')} | "
            f"**Source:** {item.get('source', 'llm')} | "
            f"**Confidence:** {item.get('confidence_score', 0.0):.2f}\n\n"
            f"{item.get('comment', '')}\n\n"
            "Reply to this comment if you disagree and I will respond."
        )
        try:
            pr.create_review_comment(
                body=_tag_bot_comment(text),
                commit=commit,
                path=item.get("file", ""),
                line=int(item.get("line", 1)),
            )
        except Exception:
            pr.create_issue_comment(
                _tag_bot_comment(
                    f"**File:** `{item.get('file')}` | **Line:** {item.get('line')}\n\n{text}"
                )
            )


def post_general_comment(repo_name: str, pr_number: int, message: str):
    repo = g.get_repo(repo_name)
    pr = repo.get_pull(pr_number)
    pr.create_issue_comment(_tag_bot_comment(message))
