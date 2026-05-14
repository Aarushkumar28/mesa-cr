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
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:5174",
        "http://localhost:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from storage.database import init_db, DB_PATH
init_db()


def get_db():
    """Get a DB connection with Row factory for dict-like access."""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


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
def health():
    try:
        conn = get_db()
        conn.execute("SELECT 1")
        conn.close()
        db_ok = True
    except Exception:
        db_ok = False
    return {
        "status": "running",
        "sqlite": "ok" if db_ok else "error",
        "timestamp": datetime.utcnow().isoformat()
    }


# ────────────────────────────────────────────────────────────────────────────────
# GitHub App Installation
# ────────────────────────────────────────────────────────────────────────────────

@app.get("/install")
async def install():

    app_name = os.getenv(
        "GITHUB_APP_NAME",
        "codereview-mesa"
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
# Legacy API Routes (used by Celery tasks and agents — do not remove)
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
    conn = get_db()
    c = conn.cursor()
    c.execute(
        "SELECT snapshot, created_at FROM architecture_snapshots WHERE repo=? ORDER BY created_at DESC LIMIT 1",
        (repo_name,)
    )
    row = c.fetchone()
    conn.close()
    return {
        "repo": repo_name,
        "snapshot": row["snapshot"] if row else "None",
        "at": row["created_at"] if row else "Never"
    }


@app.get("/api/prs/{repo_name:path}")
def open_prs_api(repo_name: str):
    conn = get_db()
    c = conn.cursor()
    c.execute("SELECT pr_number, author, changed_files, opened_at FROM open_prs WHERE repo=?", (repo_name,))
    rows = c.fetchall()
    conn.close()
    return {
        "open_prs": [
            {"pr": r["pr_number"], "author": r["author"], "files": r["changed_files"], "opened": r["opened_at"]}
            for r in rows
        ]
    }


@app.get("/api/config")
def get_config_global():
    from storage.database import get_config as load_config
    return load_config("global")


@app.post("/api/config")
async def update_config_global(request: Request):
    body = await request.json()
    from storage.database import save_config
    repo = body.get("repo", "global")
    return {"status": "updated", "config": save_config(repo, body)}


# ────────────────────────────────────────────────────────────────────────────────
# Dashboard Routes (consumed by the React frontend)
# ────────────────────────────────────────────────────────────────────────────────

@app.get("/dashboard/stats")
def dashboard_stats():
    conn = get_db()
    c = conn.cursor()
    total_comments = c.execute("SELECT COUNT(*) FROM developer_comments").fetchone()[0]
    total_prs = c.execute("SELECT COUNT(DISTINCT pr_number) FROM developer_comments").fetchone()[0]
    total_developers = c.execute("SELECT COUNT(DISTINCT username) FROM developer_comments").fetchone()[0]
    total_snapshots = c.execute("SELECT COUNT(*) FROM architecture_snapshots").fetchone()[0]
    total_installations = c.execute("SELECT COUNT(*) FROM installations").fetchone()[0]
    try:
        active_conflicts = c.execute("SELECT COUNT(*) FROM detected_conflicts").fetchone()[0]
    except Exception:
        active_conflicts = 0
    conn.close()
    return {
        "total_prs_reviewed": total_prs,
        "total_comments": total_comments,
        "total_developers": total_developers,
        "total_drift_snapshots": total_snapshots,
        "connected_repos": total_installations,
        "active_conflicts": active_conflicts,
    }


@app.get("/dashboard/activity")
def dashboard_activity(limit: int = 20):
    conn = get_db()
    c = conn.cursor()
    rows = c.execute(
        "SELECT username, repo, pr_number, category, comment, created_at "
        "FROM developer_comments ORDER BY created_at DESC LIMIT ?",
        (limit,)
    ).fetchall()
    conn.close()
    return {
        "events": [
            {
                "id": f"review-{row['repo']}-{row['pr_number']}-{i}",
                "type": "pr_reviewed",
                "description": f"PR #{row['pr_number']} reviewed in {row['repo']}",
                "developer": row["username"],
                "repo": row["repo"],
                "pr_number": row["pr_number"],
                "category": row["category"],
                "timestamp": row["created_at"],
            }
            for i, row in enumerate(rows)
        ]
    }


# ── PR REVIEWS ─────────────────────────────────────────────────────────

@app.get("/reviews")
def get_reviews(repo: str = None, page: int = 1, limit: int = 50):
    conn = get_db()
    c = conn.cursor()
    offset = (page - 1) * limit
    if repo:
        rows = c.execute(
            "SELECT repo, pr_number, username, "
            "COUNT(*) as comment_count, "
            "GROUP_CONCAT(DISTINCT category) as categories, "
            "MAX(created_at) as latest "
            "FROM developer_comments WHERE repo=? "
            "GROUP BY repo, pr_number "
            "ORDER BY latest DESC LIMIT ? OFFSET ?",
            (repo, limit, offset)
        ).fetchall()
    else:
        rows = c.execute(
            "SELECT repo, pr_number, username, "
            "COUNT(*) as comment_count, "
            "GROUP_CONCAT(DISTINCT category) as categories, "
            "MAX(created_at) as latest "
            "FROM developer_comments "
            "GROUP BY repo, pr_number "
            "ORDER BY latest DESC LIMIT ? OFFSET ?",
            (limit, offset)
        ).fetchall()

    reviews = []
    for row in rows:
        pr_row = c.execute(
            "SELECT author FROM open_prs WHERE repo=? AND pr_number=?",
            (row["repo"], row["pr_number"])
        ).fetchone()
        author = pr_row["author"] if pr_row else row["username"]
        reviews.append({
            "repo": row["repo"],
            "pr_number": row["pr_number"],
            "author": author,
            "comment_count": row["comment_count"],
            "categories": row["categories"].split(",") if row["categories"] else [],
            "date": row["latest"],
            "github_url": f"https://github.com/{row['repo']}/pull/{row['pr_number']}",
        })
    conn.close()
    return {"reviews": reviews}


@app.get("/reviews/{pr_number}")
def get_review_detail(pr_number: int, repo: str = None):
    conn = get_db()
    c = conn.cursor()
    if repo:
        comments = c.execute(
            "SELECT * FROM developer_comments WHERE pr_number=? AND repo=? ORDER BY created_at",
            (pr_number, repo)
        ).fetchall()
    else:
        comments = c.execute(
            "SELECT * FROM developer_comments WHERE pr_number=? ORDER BY created_at",
            (pr_number,)
        ).fetchall()
    conn.close()
    if not comments:
        raise HTTPException(status_code=404, detail="PR not found")
    return {
        "pr_number": pr_number,
        "repo": comments[0]["repo"],
        "author": comments[0]["username"],
        "github_url": f"https://github.com/{comments[0]['repo']}/pull/{pr_number}",
        "comments": [dict(c) for c in comments],
    }


# ── DEVELOPERS ─────────────────────────────────────────────────────────

@app.get("/developers")
def get_developers(repo: str = None):
    conn = get_db()
    c = conn.cursor()
    if repo:
        rows = c.execute(
            "SELECT username, "
            "COUNT(DISTINCT pr_number) as total_prs, "
            "COUNT(*) as total_comments, "
            "MAX(created_at) as last_active "
            "FROM developer_comments WHERE repo=? GROUP BY username "
            "ORDER BY last_active DESC",
            (repo,)
        ).fetchall()
    else:
        rows = c.execute(
            "SELECT username, "
            "COUNT(DISTINCT pr_number) as total_prs, "
            "COUNT(*) as total_comments, "
            "MAX(created_at) as last_active "
            "FROM developer_comments GROUP BY username "
            "ORDER BY last_active DESC"
        ).fetchall()

    developers = []
    for row in rows:
        active_count = c.execute(
            "SELECT COUNT(*) FROM developer_patterns WHERE username=? AND resolved=0",
            (row["username"],)
        ).fetchone()[0]
        developers.append({
            "username": row["username"],
            "total_prs": row["total_prs"],
            "total_comments": row["total_comments"],
            "last_active": row["last_active"],
            "active_patterns": active_count,
            "avatar_url": f"https://github.com/{row['username']}.png",
        })
    conn.close()
    return {"developers": developers}


@app.get("/developers/{username}")
def get_developer(username: str):
    conn = get_db()
    c = conn.cursor()
    patterns = c.execute(
        "SELECT * FROM developer_patterns WHERE username=? ORDER BY occurrence_count DESC",
        (username,)
    ).fetchall()
    comments = c.execute(
        "SELECT * FROM developer_comments WHERE username=? ORDER BY created_at DESC LIMIT 50",
        (username,)
    ).fetchall()
    total_prs = c.execute(
        "SELECT COUNT(DISTINCT pr_number) FROM developer_comments WHERE username=?",
        (username,)
    ).fetchone()[0]
    conn.close()
    if total_prs == 0:
        raise HTTPException(status_code=404, detail="Developer not found")
    return {
        "username": username,
        "avatar_url": f"https://github.com/{username}.png",
        "github_url": f"https://github.com/{username}",
        "total_prs": total_prs,
        "active_patterns": [dict(p) for p in patterns if p["resolved"] == 0],
        "resolved_patterns": [dict(p) for p in patterns if p["resolved"] == 1],
        "recent_comments": [dict(c) for c in comments],
        "dev_profile_summary": None,
    }


@app.get("/developers/{username}/patterns")
def get_developer_patterns(username: str):
    conn = get_db()
    c = conn.cursor()
    rows = c.execute(
        "SELECT * FROM developer_patterns WHERE username=? ORDER BY occurrence_count DESC",
        (username,)
    ).fetchall()
    conn.close()
    return {"patterns": [dict(r) for r in rows]}


# ── ARCHITECTURE DRIFT ─────────────────────────────────────────────────

@app.get("/drift")
def get_drift(repo: str = None):
    conn = get_db()
    c = conn.cursor()
    if repo:
        rows = c.execute(
            "SELECT * FROM architecture_snapshots WHERE repo=? ORDER BY created_at DESC",
            (repo,)
        ).fetchall()
    else:
        rows = c.execute(
            "SELECT * FROM architecture_snapshots ORDER BY created_at DESC"
        ).fetchall()
    conn.close()
    return {"snapshots": [dict(r) for r in rows]}


@app.get("/drift/latest")
def get_latest_drift(repo: str = None):
    conn = get_db()
    c = conn.cursor()
    if repo:
        row = c.execute(
            "SELECT * FROM architecture_snapshots WHERE repo=? ORDER BY created_at DESC LIMIT 1",
            (repo,)
        ).fetchone()
    else:
        row = c.execute(
            "SELECT * FROM architecture_snapshots ORDER BY created_at DESC LIMIT 1"
        ).fetchone()
    conn.close()
    if not row:
        return {"snapshot": None, "message": "No drift scans run yet"}
    return dict(row)


@app.get("/drift/{snapshot_id}")
def get_drift_detail(snapshot_id: int):
    conn = get_db()
    c = conn.cursor()
    row = c.execute(
        "SELECT * FROM architecture_snapshots WHERE id=?", (snapshot_id,)
    ).fetchone()
    conn.close()
    if not row:
        raise HTTPException(status_code=404, detail="Snapshot not found")
    return dict(row)


# ── CONFLICTS / OPEN PRs ──────────────────────────────────────────────

@app.get("/conflicts")
def get_conflicts(repo: str = None):
    conn = get_db()
    c = conn.cursor()
    if repo:
        open_prs = c.execute(
            "SELECT * FROM open_prs WHERE repo=? ORDER BY opened_at DESC", (repo,)
        ).fetchall()
    else:
        open_prs = c.execute(
            "SELECT * FROM open_prs ORDER BY opened_at DESC"
        ).fetchall()
    conflicts = []
    try:
        if repo:
            conflict_rows = c.execute(
                "SELECT * FROM detected_conflicts WHERE repo=? ORDER BY created_at DESC", (repo,)
            ).fetchall()
        else:
            conflict_rows = c.execute(
                "SELECT * FROM detected_conflicts ORDER BY created_at DESC"
            ).fetchall()
        conflicts = [dict(r) for r in conflict_rows]
    except Exception:
        pass
    conn.close()
    return {"open_prs": [dict(r) for r in open_prs], "conflicts": conflicts}


@app.get("/conflicts/{conflict_id}")
def get_conflict_detail(conflict_id: int):
    conn = get_db()
    c = conn.cursor()
    row = c.execute(
        "SELECT * FROM detected_conflicts WHERE id=?", (conflict_id,)
    ).fetchone()
    conn.close()
    if not row:
        raise HTTPException(status_code=404, detail="Conflict not found")
    return dict(row)


# ── CONNECTED REPOS (INSTALLATIONS) ────────────────────────────────────

@app.get("/repos")
def get_repos():
    conn = get_db()
    c = conn.cursor()
    rows = c.execute(
        "SELECT * FROM installations ORDER BY installed_at DESC"
    ).fetchall()
    conn.close()
    return {
        "repos": [
            {**dict(r), "webhook_active": True, "display_name": r["repo"]}
            for r in rows
        ]
    }


# ── RULES / CONFIG ────────────────────────────────────────────────────

@app.get("/repos/{repo:path}/rules")
def get_repo_rules(repo: str):
    from storage.database import get_config as load_config
    config = load_config(repo)
    if not config or config == {}:
        return {
            "repo": repo,
            "rules": {
                "security_check": True,
                "logic_errors": True,
                "style_check": True,
                "architecture_check": True,
                "drift_detection": True,
                "conflict_detection": True,
                "debate_mode": True,
                "confidence_gate": 0.70,
                "pattern_threshold": 3,
                "escalation_threshold": 0.40,
            }
        }
    return {"repo": repo, "rules": config}


@app.put("/repos/{repo:path}/rules")
async def update_repo_rules(repo: str, request: Request):
    body = await request.json()
    from storage.database import save_config
    saved = save_config(repo, body)
    return {"status": "saved", "repo": repo, "rules": saved}
