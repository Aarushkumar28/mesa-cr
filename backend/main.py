from fastapi import FastAPI, Request, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
import hmac
import hashlib
import json
import os
import sqlite3
from datetime import datetime
from pathlib import Path
from dotenv import load_dotenv

load_dotenv(dotenv_path=Path(__file__).resolve().parents[1] / ".env")

app = FastAPI(title="Code Reviewer API")
BOT_COMMENT_MARKER = "<!-- code-reviewer-bot -->"

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

from storage.database import init_db
init_db()


# ────────────────────────────────────────────────────────────────────────────────
# Signature Verification
# ────────────────────────────────────────────────────────────────────────────────

def verify_signature(payload: bytes, sig_header: str) -> bool:
    """
    Verify GitHub webhook HMAC SHA256 signature.
    """

    if not sig_header:
        return False

    secret = os.getenv("GITHUB_WEBHOOK_SECRET", "").encode()
    if not secret:
        return False

    expected = "sha256=" + hmac.new(
        secret,
        payload,
        hashlib.sha256
    ).hexdigest()

    return hmac.compare_digest(expected, sig_header)


# ────────────────────────────────────────────────────────────────────────────────
# Webhook Endpoint
# ────────────────────────────────────────────────────────────────────────────────

@app.post("/webhook")
async def webhook(request: Request, background_tasks: BackgroundTasks):

    payload_bytes = await request.body()
    sig = request.headers.get("X-Hub-Signature-256", "")
    client_ip = request.client.host if request.client else "unknown"

    from storage.database import (
        clear_webhook_failures,
        is_webhook_blocked,
        register_webhook_failure
    )

    # ─── Abuse Protection ───────────────────────────────────────────────────────

    if is_webhook_blocked(client_ip):
        raise HTTPException(
            status_code=403,
            detail="Blocked after 3 failures"
        )

    # ─── Signature Validation ───────────────────────────────────────────────────

    if not verify_signature(payload_bytes, sig):
        blocked = register_webhook_failure(client_ip)

        raise HTTPException(
            status_code=403,
            detail="Blocked after 3 failures" if blocked else "Invalid signature"
        )

    # Reset failure count after success
    clear_webhook_failures(client_ip)

    # ─── Parse Payload ──────────────────────────────────────────────────────────

    try:
        payload = json.loads(payload_bytes)
    except json.JSONDecodeError:
        raise HTTPException(status_code=400, detail="Invalid JSON payload")

    event_type = request.headers.get("X-GitHub-Event", "")
    action = payload.get("action", "")

    print(f"\n[WEBHOOK] Event Received")
    print(f"[WEBHOOK] Type   : {event_type}")
    print(f"[WEBHOOK] Action : {action}")

    # ────────────────────────────────────────────────────────────────────────────
    # Pull Request Events
    # ────────────────────────────────────────────────────────────────────────────

    def enqueue_pr(payload_data: dict):
        from backend.celery_app import process_pr
        process_pr.delay(payload_data)

    def enqueue_debate(repo_name: str, pr_number: int, comment_body: str, commenter: str):
        from backend.celery_app import process_debate
        process_debate.delay(repo_name, pr_number, comment_body, commenter)

    if event_type == "pull_request":

        repo_name = payload.get("repository", {}).get("full_name", "unknown")
        pr_number = payload.get("pull_request", {}).get("number", "unknown")

        print(f"[WEBHOOK] Repo   : {repo_name}")
        print(f"[WEBHOOK] PR     : #{pr_number}")

        # ─── Queue PR Review ────────────────────────────────────────────────────

        if action in ["opened", "synchronize", "reopened"]:
            background_tasks.add_task(enqueue_pr, payload)

            return {
                "status": "queued",
                "action": action,
                "repo": repo_name,
                "pr": pr_number
            }

    # ────────────────────────────────────────────────────────────────────────────
    # PR Comment / Debate Events
    # ────────────────────────────────────────────────────────────────────────────

    elif event_type == "issue_comment" and action == "created":

        comment = payload.get("comment", {})
        comment_body = comment.get("body", "") or ""
        comment_user = comment.get("user", {}) or {}
        commenter = comment_user.get("login", "") or ""
        commenter_type = (comment_user.get("type", "") or "").lower()
        sender_type = (payload.get("sender", {}).get("type", "") or "").lower()
        repo_name = payload.get("repository", {}).get("full_name", "")

        issue = payload.get("issue", {})
        pr_number = issue.get("number")

        bot_name = os.getenv("BOT_NAME", "").strip().lower()
        normalized_commenter = commenter.strip().lower()

        is_self_comment = bool(bot_name) and normalized_commenter == bot_name
        is_bot_actor = (
            normalized_commenter.endswith("[bot]")
            or commenter_type == "bot"
            or sender_type == "bot"
        )
        is_code_reviewer_comment = (
            BOT_COMMENT_MARKER in comment_body
            or "**Code Reviewer" in comment_body
        )

        if (
            pr_number
            and "pull_request" in issue
            and not (is_self_comment or is_bot_actor or is_code_reviewer_comment)
        ):
            background_tasks.add_task(
                enqueue_debate,
                repo_name,
                pr_number,
                comment_body,
                commenter,
            )

            return {
                "status": "debate_queued",
                "repo": repo_name,
                "pr": pr_number
            }

        if pr_number and "pull_request" in issue and (is_self_comment or is_bot_actor or is_code_reviewer_comment):
            print("[WEBHOOK] Ignored bot/self PR comment")
            return {
                "status": "ignored",
                "event": event_type,
                "action": action,
                "reason": "bot_or_self_comment",
                "repo": repo_name,
                "pr": pr_number
            }

    # ────────────────────────────────────────────────────────────────────────────
    # Ignored Events
    # ────────────────────────────────────────────────────────────────────────────

    print("[WEBHOOK] Event ignored")

    return {
        "status": "ignored",
        "event": event_type,
        "action": action
    }


# ────────────────────────────────────────────────────────────────────────────────
# Health Check
# ────────────────────────────────────────────────────────────────────────────────

@app.get("/health")
async def health():
    return {"status": "running"}


# ────────────────────────────────────────────────────────────────────────────────
# GitHub App Installation
# ────────────────────────────────────────────────────────────────────────────────

@app.get("/install")
async def install():

    app_name = os.getenv(
        "GITHUB_APP_NAME",
        "code-reviewer-bot"
    )

    return {
        "install_url":
        f"https://github.com/apps/{app_name}/installations/new"
    }


@app.get("/callback")
async def callback(
    installation_id: int,
    setup_action: str = ""
):

    from storage.database import DB_PATH

    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()

    c.execute(
        """
        INSERT INTO installations
        VALUES (NULL,?,?,?)
        """,
        (
            installation_id,
            "unknown",
            datetime.now().isoformat()
        )
    )

    conn.commit()
    conn.close()

    return {
        "status": "installed",
        "installation_id": installation_id
    }


# ────────────────────────────────────────────────────────────────────────────────
# Dashboard APIs
# ────────────────────────────────────────────────────────────────────────────────

@app.get("/api/developer/{username}")
def dev_profile_api(username: str):

    from storage.database import get_patterns

    patterns = get_patterns(username)

    return {
        "developer": username,
        "patterns": [
            {"category": c, "count": n}
            for c, n in patterns
        ],
        "total_flags": sum(n for _, n in patterns)
    }


@app.get("/api/drift/{repo_name:path}")
def drift_api(repo_name: str):

    from storage.database import DB_PATH

    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()

    c.execute(
        """
        SELECT snapshot, created_at
        FROM architecture_snapshots
        WHERE repo=?
        ORDER BY created_at DESC
        LIMIT 1
        """,
        (repo_name,)
    )

    row = c.fetchone()

    conn.close()

    return {
        "repo": repo_name,
        "snapshot": row[0] if row else "None",
        "at": row[1] if row else "Never"
    }


@app.get("/api/prs/{repo_name:path}")
def open_prs_api(repo_name: str):

    from storage.database import DB_PATH

    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()

    c.execute(
        """
        SELECT pr_number, author, changed_files, opened_at
        FROM open_prs
        WHERE repo=?
        """,
        (repo_name,)
    )

    rows = c.fetchall()

    conn.close()

    return {
        "open_prs": [
            {
                "pr": r[0],
                "author": r[1],
                "files": r[2],
                "opened": r[3]
            }
            for r in rows
        ]
    }


@app.get("/api/config")
def get_config():

    from storage.database import get_config as load_config

    return load_config("global")


@app.post("/api/config")
async def update_config(request: Request):

    body = await request.json()

    from storage.database import save_config

    repo = body.get("repo", "global")

    return {
        "status": "updated",
        "config": save_config(repo, body)
    }
