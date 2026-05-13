from agents import agent_e


def test_no_overlap_is_ignored(monkeypatch):
    monkeypatch.setattr(
        agent_e,
        "get_open_prs",
        lambda repo_name, exclude_pr: [
            {
                "number": 8,
                "author": "Aarushexe",
                "files": ["agents/agent_f.py"],
                "title": "Unrelated PR",
                "diff": "diff --git a/agents/agent_f.py b/agents/agent_f.py",
            }
        ],
    )

    llama_called = {"value": False}

    def _fake_llama(_prompt: str) -> str:
        llama_called["value"] = True
        return "YES - conflict"

    saved = {"count": 0}
    posted = []

    monkeypatch.setattr(agent_e, "call_llama", _fake_llama)
    monkeypatch.setattr(agent_e, "save_conflict", lambda *args: saved.__setitem__("count", saved["count"] + 1) or True)
    monkeypatch.setattr(agent_e, "post_general_comment", lambda *args: posted.append(args))

    result = agent_e.run(
        "owner/repo",
        7,
        ["backend/celery_app.py"],
        "diff --git a/backend/celery_app.py b/backend/celery_app.py",
    )

    assert result["conflicts_found"] == []
    assert llama_called["value"] is False
    assert saved["count"] == 0
    assert posted == []


def test_existing_conflict_does_not_repost_comments(monkeypatch):
    monkeypatch.setattr(
        agent_e,
        "get_open_prs",
        lambda repo_name, exclude_pr: [
            {
                "number": 8,
                "author": "Aarushexe",
                "files": ["backend/celery_app.py"],
                "title": "Touches celery app too",
                "diff": "diff --git a/backend/celery_app.py b/backend/celery_app.py",
            }
        ],
    )
    monkeypatch.setattr(agent_e, "call_llama", lambda _prompt: "YES - both PRs change the same logic.")
    monkeypatch.setattr(agent_e, "save_conflict", lambda *args: False)

    posted = []
    monkeypatch.setattr(agent_e, "post_general_comment", lambda *args: posted.append(args))

    result = agent_e.run(
        "owner/repo",
        7,
        ["backend/celery_app.py"],
        "diff --git a/backend/celery_app.py b/backend/celery_app.py",
    )

    assert result["conflicts_found"] == [8]
    assert posted == []
