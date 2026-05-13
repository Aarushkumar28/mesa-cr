import os
import sys
from pathlib import Path
from dotenv import load_dotenv

load_dotenv(dotenv_path=Path(__file__).resolve().parents[1] / ".env")

FORCE_LOCAL = os.getenv("FORCE_LOCAL_VECTORSTORE", "0") == "1"
if "pytest" in sys.modules:
    FORCE_LOCAL = True
USE_PINECONE = (not FORCE_LOCAL) and bool(os.getenv("PINECONE_API_KEY"))


def _simple_embedding(text: str, dim: int = 64):
    vec = [0.0] * dim
    for i, ch in enumerate(text[:1000]):
        vec[i % dim] += ord(ch) % 97 / 97.0
    return vec

if USE_PINECONE:
    from storage.pinecone_store import save_pr, search_similar
    print("[VectorStore] Using Pinecone")
else:
    # Prefer Chroma + Voyage for local vector store when available, but
    # gracefully fall back to an in-memory store if those libraries or keys
    # are not present. This keeps local dev/tests deterministic.
    try:
        if FORCE_LOCAL:
            raise RuntimeError("forced local in-memory vector store")
        import chromadb
        import voyageai

        voyage = voyageai.Client(api_key=os.getenv("VOYAGE_API_KEY"))
        chroma_client = chromadb.Client()
        collection = chroma_client.get_or_create_collection("past_prs")

        def embed_text(text: str):
            try:
                result = voyage.embed([text], model="voyage-code-2")
                return result.embeddings[0]
            except Exception:
                return _simple_embedding(text, dim=64)

        def save_pr(pr_id: str, text: str, metadata: dict = {}):
            embedding = embed_text(text)
            collection.add(
                embeddings=[embedding],
                documents=[text],
                ids=[pr_id],
                metadatas=[metadata],
            )
            print(f"[ChromaDB] Saved PR {pr_id}")

        def search_similar(query: str, n: int = 3):
            query_embedding = embed_text(query)
            return collection.query(query_embeddings=[query_embedding], n_results=n)

        print("[VectorStore] Using ChromaDB (local)")

    except Exception as _e:
        # In-memory fallback: deterministic lightweight embedding + store.
        print("[VectorStore] Chroma/Voyage not available — using in-memory fallback")
        _IN_MEMORY_INDEX = {}

        def embed_text(text: str):
            return _simple_embedding(text, dim=64)

        def save_pr(pr_id: str, text: str, metadata: dict = {}):
            embedding = embed_text(text)
            _IN_MEMORY_INDEX[pr_id] = {
                "id": pr_id,
                "values": embedding,
                "metadata": {**metadata, "text": text[:1000]},
            }
            print(f"[VectorStore-Fake] Saved PR {pr_id}")

        def search_similar(query: str, n: int = 3):
            qv = embed_text(query)

            def score(item):
                v = item["values"]
                s = 0.0
                for a, b in zip(v, qv):
                    s += a * b
                return s

            items = list(_IN_MEMORY_INDEX.values())
            items.sort(key=score, reverse=True)
            top = items[:n]
            return {"documents": [[it["metadata"].get("text", "") for it in top]]}


if __name__ == "__main__":
    save_pr("pr_1", "Added input validation to user login endpoint")
    save_pr("pr_2", "Removed authentication check from admin route")
    results = search_similar("authentication and security changes")
    print("Results:", results["documents"])
