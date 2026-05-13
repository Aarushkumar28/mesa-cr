import hashlib
import hmac
import json

from fastapi.testclient import TestClient

from backend.main import app
from storage.database import clear_webhook_failures


def _signature(secret: str, payload: bytes) -> str:
    return "sha256=" + hmac.new(secret.encode(), payload, hashlib.sha256).hexdigest()


def _pr_payload(action: str = "opened") -> dict:
    return {
        "action": action,
        "repository": {"full_name": "owner/repo"},
        "pull_request": {
            "number": 7,
            "user": {"login": "dev-user"},
            "title": "Update API",
            "body": "PR body",
        },
    }


def _issue_comment_payload(
    body: str = "I fixed this in latest commit.",
    commenter: str = "dev-user",
    user_type: str = "User",
) -> dict:
    return {
        "action": "created",
        "repository": {"full_name": "owner/repo"},
        "issue": {"number": 9, "pull_request": {"url": "https://api.github.com/repos/owner/repo/pulls/9"}},
        "comment": {
            "body": body,
            "user": {"login": commenter, "type": user_type},
        },
    }


def test_pr_opened_is_queued(monkeypatch):
    monkeypatch.setenv("GITHUB_WEBHOOK_SECRET", "test-secret")
    clear_webhook_failures("testclient")

    queued = {"called": False}

    def _fake_delay(payload):
        queued["called"] = True
        assert payload["action"] == "opened"

    import backend.celery_app as celery_app
    monkeypatch.setattr(celery_app.process_pr, "delay", _fake_delay)

    body = json.dumps(_pr_payload("opened")).encode()
    headers = {
        "X-GitHub-Event": "pull_request",
        "X-Hub-Signature-256": _signature("test-secret", body),
    }

    client = TestClient(app)
    response = client.post("/webhook", data=body, headers=headers)

    assert response.status_code == 200
    assert response.json()["status"] == "queued"
    assert queued["called"] is True


def test_non_target_pr_action_is_ignored(monkeypatch):
    monkeypatch.setenv("GITHUB_WEBHOOK_SECRET", "test-secret")
    clear_webhook_failures("testclient")

    body = json.dumps(_pr_payload("closed")).encode()
    headers = {
        "X-GitHub-Event": "pull_request",
        "X-Hub-Signature-256": _signature("test-secret", body),
    }

    client = TestClient(app)
    response = client.post("/webhook", data=body, headers=headers)

    assert response.status_code == 200
    assert response.json()["status"] == "ignored"


def test_invalid_signature_block_after_three_failures(monkeypatch):
    monkeypatch.setenv("GITHUB_WEBHOOK_SECRET", "test-secret")
    clear_webhook_failures("testclient")

    body = json.dumps(_pr_payload("opened")).encode()
    headers = {
        "X-GitHub-Event": "pull_request",
        "X-Hub-Signature-256": "sha256=bad",
    }

    client = TestClient(app)

    r1 = client.post("/webhook", data=body, headers=headers)
    r2 = client.post("/webhook", data=body, headers=headers)
    r3 = client.post("/webhook", data=body, headers=headers)
    r4 = client.post("/webhook", data=body, headers=headers)

    assert r1.status_code == 403
    assert r2.status_code == 403
    assert r3.status_code == 403
    assert r3.json()["detail"] == "Blocked after 3 failures"
    assert r4.status_code == 403
    assert r4.json()["detail"] == "Blocked after 3 failures"


def test_issue_comment_queues_debate(monkeypatch):
    monkeypatch.setenv("GITHUB_WEBHOOK_SECRET", "test-secret")
    monkeypatch.setenv("BOT_NAME", "review-bot")
    clear_webhook_failures("testclient")

    queued = {"called": False}

    def _fake_delay(repo_name, pr_number, comment_body, commenter):
        queued["called"] = True
        assert repo_name == "owner/repo"
        assert pr_number == 9
        assert commenter == "dev-user"
        assert "fixed" in comment_body

    import backend.celery_app as celery_app
    monkeypatch.setattr(celery_app.process_debate, "delay", _fake_delay)

    body = json.dumps(_issue_comment_payload()).encode()
    headers = {
        "X-GitHub-Event": "issue_comment",
        "X-Hub-Signature-256": _signature("test-secret", body),
    }

    client = TestClient(app)
    response = client.post("/webhook", data=body, headers=headers)

    assert response.status_code == 200
    assert response.json()["status"] == "debate_queued"
    assert queued["called"] is True


def test_bot_tagged_issue_comment_is_ignored_without_bot_name(monkeypatch):
    monkeypatch.setenv("GITHUB_WEBHOOK_SECRET", "test-secret")
    monkeypatch.delenv("BOT_NAME", raising=False)
    clear_webhook_failures("testclient")

    queued = {"called": False}

    def _fake_delay(repo_name, pr_number, comment_body, commenter):
        queued["called"] = True

    import backend.celery_app as celery_app
    monkeypatch.setattr(celery_app.process_debate, "delay", _fake_delay)

    body = json.dumps(
        _issue_comment_payload(
            body="<!-- code-reviewer-bot -->\n⚠️ **Human Review Needed** — 1 low-confidence finding(s)",
            commenter="aarushkumar28",
            user_type="User",
        )
    ).encode()
    headers = {
        "X-GitHub-Event": "issue_comment",
        "X-Hub-Signature-256": _signature("test-secret", body),
    }

    client = TestClient(app)
    response = client.post("/webhook", data=body, headers=headers)

    assert response.status_code == 200
    assert response.json()["status"] == "ignored"
    assert response.json()["reason"] == "bot_or_self_comment"
    assert queued["called"] is False
