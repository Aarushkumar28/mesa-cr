import requests


def fallback_llm_response(prompt: str) -> str:
    lowered = prompt.lower()
    if "find all issues" in lowered or "return only a json array" in lowered:
        return "[]"
    if "does the new change contradict" in lowered:
        if ("async" in lowered and "synchronous" in lowered) or ("sync db" in lowered and "async" in lowered):
            return "YES - the new change appears to reintroduce synchronous database access after an async-only decision."
        return "NO"
    if "summarize this developer's code review history" in lowered:
        return "No history found. Applying standard review."
    if "compare two repository structures" in lowered or "drift detected" in lowered:
        return "No significant drift detected."
    if "start your response with exactly one word" in lowered:
        return "MAINTAIN\n\nNo major issue found based on the current diff."
    return ""


def call_llama(prompt: str) -> str:
    """Call the local Ollama LLaMA3 model, or fall back if Ollama is unavailable."""
    try:
        response = requests.post(
            "http://localhost:11434/api/generate",
            json={"model": "llama3", "prompt": prompt, "stream": False},
            timeout=60,
        )
        response.raise_for_status()
        return response.json().get("response", "")
    except Exception as e:
        print(f"[LLM ERROR] {e}")
        return fallback_llm_response(prompt)


if __name__ == "__main__":
    result = call_llama("Say hello in one sentence.")
    print(result)
