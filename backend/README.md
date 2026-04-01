# FastAPI Resume Parser

## What it does

This backend focuses on the first milestone:

- upload a resume file
- extract plain text from PDF, DOCX, or TXT
- build a structured resume profile
- generate normalized text for future embedding

## Suggested setup

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

## Endpoints

- `GET /api/v1/health`
- `POST /api/v1/resume/parse`
- `POST /api/v1/jobs/import`
- `POST /api/v1/jobs/import-excel`
- `GET /api/v1/jobs`
- `GET /api/v1/resumes`
- `POST /api/v1/match/resume-to-jobs`

## Example request

```bash
curl -X POST "http://127.0.0.1:8000/api/v1/resume/parse" ^
  -H "accept: application/json" ^
  -H "Content-Type: multipart/form-data" ^
  -F "file=@example_resume.pdf" ^
  -F "target_role=AI Product Lead" ^
  -F "city=Shanghai" ^
  -F "notes=Interested in AI application and backend roles"
```

## Parse response

The parse endpoint returns:

- extracted raw text
- legacy `profile`
- `structured_resume` for database storage
- `hard_conditions` for exact filtering
- `soft_conditions` for semantic matching
- `vectorization_payload` for embedding and retrieval
- normalized `embedding_text`

## Matching split

Use `hard_conditions` for:

- degree threshold
- years of experience
- target roles
- target cities
- languages

Use `soft_conditions` for:

- skills
- tool familiarity
- domain tags
- project keywords
- work keywords
- embedding text

That output is designed so your next step can be:

`resume -> embedding -> ChromaDB search -> top-k jobs`

## One-click pipeline

1. Start FastAPI.
2. Import jobs from `sample_jobs.json`.
3. Upload a resume to the match endpoint.

### Import sample jobs

```bash
curl -X POST "http://127.0.0.1:8000/api/v1/jobs/import" ^
  -H "accept: application/json" ^
  -H "Content-Type: application/json" ^
  --data "@sample_jobs.json"
```

### Import jobs from Excel

```bash
curl -X POST "http://127.0.0.1:8000/api/v1/jobs/import-excel" ^
  -H "accept: application/json" ^
  -H "Content-Type: multipart/form-data" ^
  -F "file=@your_jobs.xlsx"
```

### Match a resume against stored jobs

```bash
curl -X POST "http://127.0.0.1:8000/api/v1/match/resume-to-jobs" ^
  -H "accept: application/json" ^
  -H "Content-Type: multipart/form-data" ^
  -F "file=@example_resume.pdf" ^
  -F "target_role=Customer Service Specialist" ^
  -F "city=Changsha" ^
  -F "limit=5"
```

The matching pipeline uses:

- SQLite for job storage
- SQLite for parsed resume storage
- deterministic local vectors for runnable end-to-end scoring
- hard filters for degree, years, city, and language
- soft matching for skills and embedding similarity
