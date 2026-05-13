import json
import os
import re
import shutil
import subprocess
import tempfile
from pathlib import Path


def _line_from_diff(diff_text: str, filename: str, token: str = "") -> int:
    current_file = None
    current_line = 1
    for raw in diff_text.splitlines():
        if raw.startswith("File: "):
            current_file = raw.replace("File: ", "", 1).strip()
            current_line = 1
            continue
        if current_file != filename:
            continue
        if raw.startswith("@@"):
            match = re.search(r"\+(\d+)", raw)
            if match:
                current_line = int(match.group(1))
            continue
        if raw.startswith("+") and not raw.startswith("+++"):
            if not token or token in raw:
                return current_line
            current_line += 1
        elif raw.startswith(" ") or raw.startswith("-"):
            if not raw.startswith("-"):
                current_line += 1
    return 1


def _reconstruct_added_files(diff_text: str, target_dir: Path) -> list:
    files = []
    current_file = None
    lines = []

    def flush():
        if not current_file:
            return
        safe_path = target_dir / current_file
        safe_path.parent.mkdir(parents=True, exist_ok=True)
        safe_path.write_text("\n".join(lines) + "\n", encoding="utf-8")
        files.append(current_file)

    for raw in diff_text.splitlines():
        if raw.startswith("File: "):
            flush()
            current_file = raw.replace("File: ", "", 1).strip()
            lines = []
            continue
        if current_file and raw.startswith("+") and not raw.startswith("+++"):
            lines.append(raw[1:])
    flush()
    return files


def _static_lint(diff_text: str) -> list:
    findings = []
    current_file = ""
    for raw in diff_text.splitlines():
        if raw.startswith("File: "):
            current_file = raw.replace("File: ", "", 1).strip()
            continue
        if not raw.startswith("+") or raw.startswith("+++"):
            continue
        code = raw[1:]
        checks = [
            ("security", "high", "Use of eval() can execute untrusted code.", "eval("),
            ("security", "high", "Shell execution with shell=True can turn user input into command execution.", "shell=True"),
            ("security", "medium", "Hard-coded secrets or tokens should not be committed.", "password="),
            ("bad_practice", "medium", "Debug print statements should usually be removed or replaced with logging.", "print("),
        ]
        for category, severity, comment, token in checks:
            if token.lower() in code.lower():
                findings.append({
                    "file": current_file,
                    "line": _line_from_diff(diff_text, current_file, token),
                    "category": category,
                    "severity": severity,
                    "comment": comment,
                    "source": "static_lint",
                    "llm_certainty": 0.82 if severity == "high" else 0.70,
                })
    return findings


def _run_docker_linter(diff_text: str, enabled_linters: list) -> list:
    if os.getenv("DOCKER_LINT_ENABLED", "1") != "1" or not shutil.which("docker"):
        return []

    image = os.getenv("LINTER_IMAGE", "ghcr.io/returntocorp/semgrep:latest")
    with tempfile.TemporaryDirectory(prefix="code-reviewer-lint-") as tmp:
        workdir = Path(tmp)
        files = _reconstruct_added_files(diff_text, workdir)
        if not files:
            return []

        commands = []
        if "semgrep" in enabled_linters:
            commands.append("semgrep --config=auto --json /work")
        if "flake8" in enabled_linters:
            commands.append("python -m flake8 /work --format=json")
        if not commands:
            return []

        findings = []
        for command in commands:
            result = subprocess.run(
                [
                    "docker", "run", "--rm", "--network", "none",
                    "--memory", "512m", "--cpus", "1",
                    "-v", f"{workdir}:/work:ro", image, "sh", "-lc", command,
                ],
                text=True,
                capture_output=True,
                timeout=int(os.getenv("LINTER_TIMEOUT_SECONDS", "60")),
            )
            output = result.stdout.strip()
            if not output:
                continue
            try:
                parsed = json.loads(output)
            except json.JSONDecodeError:
                continue
            for item in parsed.get("results", []):
                path = item.get("path", "").replace("/work/", "")
                extra = item.get("extra", {})
                findings.append({
                    "file": path,
                    "line": item.get("start", {}).get("line", 1),
                    "category": "security",
                    "severity": extra.get("severity", "medium").lower(),
                    "comment": extra.get("message", "Linter finding"),
                    "source": "docker_linter",
                    "llm_certainty": 0.9,
                })
        return findings


def run_sandboxed_linters(diff_text: str, enabled_linters: list | None = None) -> list:
    enabled = enabled_linters or ["pylint", "flake8", "semgrep", "eslint"]
    try:
        docker_findings = _run_docker_linter(diff_text, enabled)
    except Exception as exc:
        docker_findings = [{
            "file": "",
            "line": 1,
            "category": "bad_practice",
            "severity": "low",
            "comment": f"Docker lint sandbox could not run: {exc}",
            "source": "docker_linter",
            "llm_certainty": 0.35,
        }]
    return docker_findings + _static_lint(diff_text)
