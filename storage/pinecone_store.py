import os
from pathlib import Path
from dotenv import load_dotenv

load_dotenv(dotenv_path=Path(__file__).resolve().parents[1] / ".env")

# Try importing real Pinecone and Voyage clients; if unavailable or keys missing,
# fall back to a simple in-memory store and a cheap embedding function so tests
# and local development work without external services or API keys.
USE_REAL_PINECONE = False
try:
    from pinecone import Pinecone, ServerlessSpec
    import voyageai
    PINECONE_API_KEY = os.getenv("PINECONE_API_KEY")
    VOYAGE_API_KEY = os.getenv("VOYAGE_API_KEY")
    if PINECONE_API_KEY and VOYAGE_API_KEY:
        voyage = voyageai.Client(api_key=VOYAGE_API_KEY)
        pc = Pinecone(api_key=PINECONE_API_KEY)
        USE_REAL_PINECONE = True
except Exception:
    USE_REAL_PINECONE = False


if USE_REAL_PINECONE:
    def get_index():
        if "past-prs" not in pc.list_indexes().names():
            pc.create_index(
                "past-prs",
                dimension=1024,
                spec=ServerlessSpec(cloud="aws", region="us-east-1"),
            )
        return pc.Index("past-prs")


    def embed_text(text: str):
        result = voyage.embed([text], model="voyage-code-2")
        return result.embeddings[0]


    def save_pr(pr_id: str, text: str, metadata: dict = {}):
        index = get_index()
        embedding = embed_text(text)
        index.upsert(
            vectors=[{
                "id": pr_id,
                "values": embedding,
                "metadata": {**metadata, "text": text[:1000]},
            }]
        )
        print(f"[Pinecone] Saved PR {pr_id}")


    def search_similar(query: str, n: int = 3):
        index = get_index()
        embedding = embed_text(query)
        results = index.query(vector=embedding, top_k=n, include_metadata=True)
        return {
            "documents": [[m["metadata"].get("text", "") for m in results["matches"]]]
        }

else:
    # Simple in-memory fallback store
    _IN_MEMORY_INDEX = {}

    def _simple_embedding(text: str, dim: int = 64):
        # deterministic lightweight embedding: map character codes into a fixed vector
        vec = [0.0] * dim
        for i, ch in enumerate(text[:1000]):
            vec[i % dim] += ord(ch) % 97 / 97.0
        return vec


    def get_index():
        return _IN_MEMORY_INDEX


    def embed_text(text: str):
        return _simple_embedding(text, dim=64)


    def save_pr(pr_id: str, text: str, metadata: dict = {}):
        embedding = embed_text(text)
        _IN_MEMORY_INDEX[pr_id] = {
            "id": pr_id,
            "values": embedding,
            "metadata": {**metadata, "text": text[:1000]},
        }
        print(f"[Pinecone-Fake] Saved PR {pr_id}")


    def search_similar(query: str, n: int = 3):
        qv = embed_text(query)
        # compute simple dot-product similarity
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
