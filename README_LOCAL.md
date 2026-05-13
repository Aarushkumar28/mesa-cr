Local development and testing commands
===================================

Quick start (run these in separate terminals):

1. Start Redis / Memurai (if using Memurai on Windows):

PowerShell:
Start-Service Memurai
Or using Docker:
docker run -d --name code-reviewer-redis -p 6379:6379 redis:7

2. Start Ollama (LLM server):

PowerShell:
ollama serve

3. Start Celery worker:

PowerShell:
cd C:\\internships\\mesanite\\code-reviewer
celery -A backend.celery_app worker --loglevel=info -P solo

4. Start FastAPI (backend):

PowerShell:
cd C:\\internships\\mesanite\\code-reviewer
uvicorn backend.main:app --reload --port 8000

5. Verify health and docs:

PowerShell:
Invoke-RestMethod http://127.0.0.1:8000/health
Open in browser: http://127.0.0.1:8000/docs

Run tests:

PowerShell:
cd C:\\internships\\mesanite\\code-reviewer
python -m pytest tests -q

Notes:
- The project supports offline local testing: if Pinecone/Voyage API keys are not provided, a lightweight in-memory fallback is used.
- Do NOT commit your .env — it is excluded by .gitignore.
