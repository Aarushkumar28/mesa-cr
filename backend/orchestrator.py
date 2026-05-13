import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
import asyncio


async def _run_parallel(
    repo_name: str,
    pr_number: int,
    pr_author: str,
    pr_title: str,
    pr_body: str,
):
    from agents.agent_a import run as run_a
    from agents.agent_b import run as run_b
    from agents.agent_c import run as run_c

    task_a = asyncio.to_thread(
        run_a,
        repo_name,
        pr_number,
        pr_author,
        "",
    )

    task_b = asyncio.to_thread(
        run_b,
        f"{repo_name}_pr_{pr_number}",
        pr_title,
        pr_body,
        "",
        repo_name,
    )

    task_c = asyncio.to_thread(
        run_c,
        pr_author,
        repo_name,
        pr_number,
    )

    result_a, result_b, profile = await asyncio.gather(task_a, task_b, task_c)

    return result_a, result_b, profile


def _merge_state(
    repo_name: str,
    pr_number: int,
    result_a: dict,
    result_b: dict,
    profile: dict,
) -> dict:
    return {
        "repo_name": repo_name,
        "pr_number": pr_number,

        # Agent A
        "diff_issues": result_a.get("diff_issues", []),
        "diff_text": result_a.get("diff_text", ""),
        "changed_files": result_a.get("changed_files", []),

        # Agent B
        "rag_context": result_b.get("context_text", ""),
        "related_prs": result_b.get("related_prs", []),
        "contradiction": result_b.get("contradiction", ""),

        # Agent C
        "dev_profile": profile.get("profile_summary", ""),
        "recurrence_weight": profile.get("recurrence_weight", 0.5),
    }


def run_review_graph(
    repo_name: str,
    pr_number: int,
    pr_author: str,
    pr_title: str,
    pr_body: str,
) -> dict:
    result_a, result_b, profile = asyncio.run(
        _run_parallel(
            repo_name,
            pr_number,
            pr_author,
            pr_title,
            pr_body,
        )
    )

    merged = _merge_state(
        repo_name,
        pr_number,
        result_a,
        result_b,
        profile,
    )

    try:
        from agents.agent_e import run as run_e
        merged["conflicts"] = run_e(
            repo_name,
            pr_number,
            merged["changed_files"],
            merged["diff_text"],
        )
    except Exception as exc:
        print(f"[Agent E ERROR] {exc}")
        merged["conflicts"] = {
            "conflicts_found": [],
            "status": "agent_e_failed",
        }

    return merged
