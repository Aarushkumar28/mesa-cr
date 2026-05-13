import sqlite3
from datetime import datetime
import os
import sys

# Use a separate test DB when running under pytest to avoid sharing state
if 'pytest' in sys.modules:
    DB_PATH = os.getenv('CODE_REVIEW_DB', 'test_codereview.db')
else:
    DB_PATH = os.getenv('CODE_REVIEW_DB', 'codereview.db')


def init_db():
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()

    c.execute("""CREATE TABLE IF NOT EXISTS developer_comments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT,
        repo TEXT,
        pr_number INTEGER,
        category TEXT,
        comment TEXT,
        created_at TEXT
    )""")

    c.execute("""CREATE TABLE IF NOT EXISTS developer_patterns (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT,
        category TEXT,
        occurrence_count INTEGER DEFAULT 1,
        resolved INTEGER DEFAULT 0,
        clean_count INTEGER DEFAULT 0,
        last_seen TEXT
    )""")
    try:
        c.execute("ALTER TABLE developer_patterns ADD COLUMN clean_count INTEGER DEFAULT 0")
    except sqlite3.OperationalError:
        pass

    c.execute("""CREATE TABLE IF NOT EXISTS architecture_snapshots (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        repo TEXT,
        snapshot TEXT,
        created_at TEXT
    )""")

    c.execute("""CREATE TABLE IF NOT EXISTS open_prs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        repo TEXT,
        pr_number INTEGER,
        author TEXT,
        changed_files TEXT,
        opened_at TEXT
    )""")

    c.execute("""CREATE UNIQUE INDEX IF NOT EXISTS idx_open_prs_repo_number
        ON open_prs(repo, pr_number)""")

    c.execute("""CREATE TABLE IF NOT EXISTS detected_conflicts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        repo TEXT,
        pr_number INTEGER,
        conflicting_pr_number INTEGER,
        files TEXT,
        reason TEXT,
        created_at TEXT
    )""")
    c.execute("""CREATE UNIQUE INDEX IF NOT EXISTS idx_detected_conflicts_pair
        ON detected_conflicts(repo, pr_number, conflicting_pr_number)""")

    c.execute("""CREATE TABLE IF NOT EXISTS review_config (
        repo TEXT PRIMARY KEY,
        confidence_threshold REAL DEFAULT 0.70,
        enabled_linters TEXT DEFAULT 'pylint,flake8,semgrep,eslint',
        strictness TEXT DEFAULT 'standard',
        updated_at TEXT
    )""")

    c.execute("""CREATE TABLE IF NOT EXISTS webhook_failures (
        source TEXT PRIMARY KEY,
        failure_count INTEGER DEFAULT 0,
        blocked INTEGER DEFAULT 0,
        updated_at TEXT
    )""")

    c.execute("""CREATE TABLE IF NOT EXISTS installations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        installation_id INTEGER,
        repo TEXT,
        installed_at TEXT
    )""")

    conn.commit()
    conn.close()
    print("[DB] Database initialized")


def save_comment(username: str, repo: str, pr_number: int, category: str, comment: str):
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute(
        """INSERT INTO developer_comments(username, repo, pr_number, category, comment, created_at)
           VALUES (?,?,?,?,?,?)""",
        (username, repo, pr_number, category, comment, datetime.now().isoformat()),
    )
    c.execute(
        "SELECT id, occurrence_count FROM developer_patterns WHERE username=? AND category=?",
        (username, category),
    )
    row = c.fetchone()
    if row:
        c.execute(
            "UPDATE developer_patterns SET occurrence_count=occurrence_count+1, clean_count=0, last_seen=? WHERE id=?",
            (datetime.now().isoformat(), row[0]),
        )
    else:
        c.execute(
            """INSERT INTO developer_patterns(username, category, occurrence_count, resolved, clean_count, last_seen)
               VALUES (?,?,1,0,0,?)""",
            (username, category, datetime.now().isoformat()),
        )
    conn.commit()
    conn.close()


def get_patterns(username: str):
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute(
        """SELECT category, occurrence_count FROM developer_patterns
           WHERE username=? AND resolved=0 AND occurrence_count >= 2
           ORDER BY occurrence_count DESC""",
        (username,),
    )
    rows = c.fetchall()
    conn.close()
    return rows


def resolve_pattern(username: str, category: str):
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute(
        "UPDATE developer_patterns SET resolved=1 WHERE username=? AND category=?",
        (username, category),
    )
    conn.commit()
    conn.close()


def mark_clean_review(username: str, seen_categories: list):
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute(
        "SELECT category FROM developer_patterns WHERE username=? AND resolved=0",
        (username,),
    )
    categories = [row[0] for row in c.fetchall()]
    for category in categories:
        if category in seen_categories:
            continue
        c.execute(
            """UPDATE developer_patterns
               SET clean_count=clean_count+1,
                   resolved=CASE WHEN clean_count + 1 >= 5 THEN 1 ELSE resolved END
               WHERE username=? AND category=?""",
            (username, category),
        )
    conn.commit()
    conn.close()


def update_open_pr(repo: str, pr_number: int, author: str, changed_files: list):
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute(
        """INSERT INTO open_prs(repo, pr_number, author, changed_files, opened_at)
           VALUES(?,?,?,?,?)
           ON CONFLICT(repo, pr_number) DO UPDATE SET
             author=excluded.author,
             changed_files=excluded.changed_files""",
        (repo, pr_number, author, ",".join(changed_files), datetime.now().isoformat()),
    )
    conn.commit()
    conn.close()


def remove_open_pr(repo: str, pr_number: int):
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute("DELETE FROM open_prs WHERE repo=? AND pr_number=?", (repo, pr_number))
    conn.commit()
    conn.close()


def save_conflict(repo: str, pr_number: int, conflicting_pr_number: int, files: list, reason: str) -> bool:
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute(
        """INSERT OR IGNORE INTO detected_conflicts(
               repo, pr_number, conflicting_pr_number, files, reason, created_at
           ) VALUES (?,?,?,?,?,?)""",
        (repo, pr_number, conflicting_pr_number, ",".join(files), reason, datetime.now().isoformat()),
    )
    inserted = c.rowcount > 0
    conn.commit()
    conn.close()
    return inserted


def get_latest_architecture_snapshot(repo: str) -> str:
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute(
        "SELECT snapshot FROM architecture_snapshots WHERE repo=? ORDER BY created_at DESC LIMIT 1",
        (repo,),
    )
    row = c.fetchone()
    conn.close()
    return row[0] if row else ""


def get_config(repo: str = "global") -> dict:
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute(
        "SELECT confidence_threshold, enabled_linters, strictness FROM review_config WHERE repo=?",
        (repo,),
    )
    row = c.fetchone()
    conn.close()
    if not row:
        return {
            "repo": repo,
            "confidence_threshold": 0.70,
            "enabled_linters": ["pylint", "flake8", "semgrep", "eslint"],
            "strictness": "standard",
        }
    return {
        "repo": repo,
        "confidence_threshold": row[0],
        "enabled_linters": [item for item in row[1].split(",") if item],
        "strictness": row[2],
    }


def save_config(repo: str, config: dict) -> dict:
    threshold = float(config.get("confidence_threshold", config.get("threshold", 0.70)))
    linters = config.get("enabled_linters", config.get("linters", ["pylint", "flake8", "semgrep", "eslint"]))
    if isinstance(linters, list):
        linters = ",".join(linters)
    strictness = config.get("strictness", "standard")
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute(
        """INSERT INTO review_config(repo, confidence_threshold, enabled_linters, strictness, updated_at)
           VALUES(?,?,?,?,?)
           ON CONFLICT(repo) DO UPDATE SET
             confidence_threshold=excluded.confidence_threshold,
             enabled_linters=excluded.enabled_linters,
             strictness=excluded.strictness,
             updated_at=excluded.updated_at""",
        (repo, threshold, linters, strictness, datetime.now().isoformat()),
    )
    conn.commit()
    conn.close()
    return get_config(repo)


def register_webhook_failure(source: str) -> bool:
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    now = datetime.now().isoformat()
    c.execute("SELECT failure_count FROM webhook_failures WHERE source=?", (source,))
    row = c.fetchone()
    count = (row[0] if row else 0) + 1
    blocked = 1 if count >= 3 else 0
    c.execute(
        """INSERT INTO webhook_failures(source, failure_count, blocked, updated_at)
           VALUES(?,?,?,?)
           ON CONFLICT(source) DO UPDATE SET
             failure_count=excluded.failure_count,
             blocked=excluded.blocked,
             updated_at=excluded.updated_at""",
        (source, count, blocked, now),
    )
    conn.commit()
    conn.close()
    return bool(blocked)


def clear_webhook_failures(source: str):
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute(
        """INSERT INTO webhook_failures(source, failure_count, blocked, updated_at)
           VALUES(?,0,0,?)
           ON CONFLICT(source) DO UPDATE SET failure_count=0, blocked=0, updated_at=?""",
        (source, datetime.now().isoformat(), datetime.now().isoformat()),
    )
    conn.commit()
    conn.close()


def is_webhook_blocked(source: str) -> bool:
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute("SELECT blocked FROM webhook_failures WHERE source=?", (source,))
    row = c.fetchone()
    conn.close()
    return bool(row and row[0])


if __name__ == "__main__":
    init_db()

# If running under pytest, ensure the test DB is initialized on import so tests
# that don't call `setup()` still have tables available.
try:
    import sys
    if 'pytest' in sys.modules:
        init_db()
except Exception:
    pass
