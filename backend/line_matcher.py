import re


def diff_added_lines(diff_text: str) -> dict:
    mapping = {}
    current_file = None
    current_line = 1
    for raw in diff_text.splitlines():
        if raw.startswith("File: "):
            current_file = raw.replace("File: ", "", 1).strip()
            mapping.setdefault(current_file, set())
            current_line = 1
            continue
        if not current_file:
            continue
        if raw.startswith("@@"):
            match = re.search(r"\+(\d+)", raw)
            if match:
                current_line = int(match.group(1))
            continue
        if raw.startswith("+") and not raw.startswith("+++"):
            mapping.setdefault(current_file, set()).add(current_line)
            current_line += 1
        elif raw.startswith(" "):
            current_line += 1
    return mapping


def attach_valid_lines(comments: list, diff_text: str) -> list:
    added = diff_added_lines(diff_text)
    normalized = []
    for item in comments:
        file_name = item.get("file") or item.get("path") or ""
        valid_lines = sorted(added.get(file_name, []))
        if not valid_lines and added:
            file_name = next(iter(added))
            valid_lines = sorted(added[file_name])
        line = item.get("line", valid_lines[0] if valid_lines else 1)
        if valid_lines and line not in added.get(file_name, set()):
            line = min(valid_lines, key=lambda value: abs(value - int(line or 1)))
        item["file"] = file_name
        item["line"] = int(line or 1)
        normalized.append(item)
    return normalized
