import requests
import json
import sys
import time

SERVER_URL = "http://127.0.0.1:8000"

DEMO_PAYLOAD = {
    "action": "opened",
    "number": 42,
    "pull_request": {
        "number": 42,
        "title": "feat: add user authentication module",
        "body": "This PR adds JWT-based authentication. Introduces /login and /logout endpoints.",
        "user": {"login": "demo-developer"},
        "head": {"sha": "abc123def456"},
        "base": {"sha": "000000000000"},
    },
    "repository": {
        "full_name": "demo-org/demo-repo",
        "name": "demo-repo",
        "owner": {"login": "demo-org"},
    },
    "sender": {"login": "demo-developer"},
}

DEMO_COMMENT_PAYLOAD = {
    "action": "created",
    "comment": {
        "body": "Should we use refresh tokens instead of short-lived JWTs?",
        "user": {"login": "senior-reviewer"},
    },
    "issue": {
        "number": 42,
        "pull_request": {"url": "https://api.github.com/repos/demo-org/demo-repo/pulls/42"},
    },
    "repository": {"full_name": "demo-org/demo-repo"},
}

def divider(title):
    print("\n" + "=" * 55)
    print(f"  {title}")
    print("=" * 55)

def check_server():
    try:
        r = requests.get(f"{SERVER_URL}/health", timeout=3)
        print(f"✅  FastAPI server is UP at {SERVER_URL}")
        return True
    except:
        print(f"❌  FastAPI server not found — start it first")
        return False

def send_webhook(event_type, payload):
    headers = {"Content-Type": "application/json", "X-GitHub-Event": event_type}
    try:
        r = requests.post(f"{SERVER_URL}/webhook", headers=headers, data=json.dumps(payload), timeout=10)
        print(f"  HTTP {r.status_code}  →  {json.dumps(r.json(), indent=4)}")
    except Exception as e:
        print(f"  ❌ {e}")

divider("STEP 0 — Check server")
if not check_server(): sys.exit(1)

divider("STEP 1 — Health check")
print(requests.get(f"{SERVER_URL}/health").json())

divider("STEP 2 — PR Opened (queues Celery task)")
send_webhook("pull_request", DEMO_PAYLOAD)
print("\n  ⏳ Waiting 3s for Celery to pick up...")
time.sleep(3)

divider("STEP 3 — Ignored event (labeled action)")
send_webhook("pull_request", {**DEMO_PAYLOAD, "action": "labeled"})

divider("STEP 4 — Developer reply → triggers Agent F")
send_webhook("issue_comment", DEMO_COMMENT_PAYLOAD)
time.sleep(2)

divider("STEP 5 — Developer profile API")
print(requests.get(f"{SERVER_URL}/api/developer/demo-developer").json())

divider("STEP 6 — PR Closed cleanup")
send_webhook("pull_request", {**DEMO_PAYLOAD, "action": "closed"})

divider("DEMO COMPLETE ✅")
print("  Open http://127.0.0.1:8000/docs to see all endpoints\n")
