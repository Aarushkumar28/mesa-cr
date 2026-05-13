import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from celery import Celery
from celery.schedules import crontab
import os
from pathlib import Path
from dotenv import load_dotenv

load_dotenv(dotenv_path=Path(__file__).resolve().parents[1] / ".env")

celery_app = Celery(
    "code_reviewer",
    broker=os.getenv("REDIS_URL", "redis://localhost:6379/0"),
    backend=os.getenv("REDIS_URL", "redis://localhost:6379/0"),
)

celery_app.conf.beat_schedule = {
    "weekly-drift-check": {
        "task": "backend.celery_app.run_drift_check",
        "schedule": crontab(hour=10, minute=0, day_of_week=1),
    }
}


@celery_app.task
def process_pr(payload: dict):
    repo_name = payload["repository"]["full_name"]
    pr_number = payload["pull_request"]["number"]
    pr_author = payload["pull_request"]["user"]["login"]
    pr_title = payload["pull_request"].get("title", "")
    pr_body = payload["pull_request"].get("body", "") or ""

    from backend.orchestrator import run_review_graph
    merged = run_review_graph(repo_name, pr_number, pr_author, pr_title, pr_body)

    print(f"[Celery] Agents A/B/C complete for PR #{pr_number}")

    from storage.database import get_config, get_latest_architecture_snapshot, update_open_pr
    config = get_config(repo_name)
    merged["architecture_snapshot"] = get_latest_architecture_snapshot(repo_name)
    update_open_pr(repo_name, pr_number, pr_author, merged["changed_files"])

    # LLM Layer: final enriched review
    from backend.llm_layer import generate_final_review
    final_comments = generate_final_review(merged)

    # Confidence Gate
    from backend.confidence_gate import filter_comments
    inline_comments, human_comments = filter_comments(
        final_comments,
        merged["recurrence_weight"],
        config.get("confidence_threshold", 0.70),
    )

    # Post to GitHub
    from backend.github_poster import post_review_comments, post_general_comment
    post_review_comments(repo_name, pr_number, inline_comments)

    if human_comments:
        alert = f"⚠️ **Human Review Needed** — {len(human_comments)} low-confidence finding(s):\n"
        for h in human_comments:
            alert += f"\n- `{h.get('file', '?')}:{h.get('line', '?')}` — {h.get('comment', '')[:100]}"
        post_general_comment(repo_name, pr_number, alert)

    # Record comments in DB for developer profile
    from agents.agent_c import record_comments
    record_comments(pr_author, repo_name, pr_number, final_comments)

    # Store this PR in vector memory
    from agents.agent_b import store_pr_in_memory
    store_pr_in_memory(
        f"{repo_name}_pr_{pr_number}",
        pr_title,
        pr_body,
        merged["diff_text"],
        repo_name,
    )

    print(f"[Celery] PR #{pr_number} review complete. {len(inline_comments)} inline, {len(human_comments)} to human.")
    return {"status": "complete", "pr": pr_number}


@celery_app.task
def run_drift_check():
    from agents.agent_d import run
    # Replace with your actual repo name or make dynamic
    repo = os.getenv("DEFAULT_REPO", "your-username/your-repo")
    result = run(repo)
    print("[Drift Check]", result)
    return result


@celery_app.task
def process_debate(repo_name: str, pr_number: int, comment_body: str, commenter: str):
    from agents.agent_f import run
    return run(repo_name, pr_number, comment_body, commenter)
