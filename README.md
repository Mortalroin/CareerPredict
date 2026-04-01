# Career Predict Frontend

## Run locally

1. Install Node.js 20 or newer.
2. Copy `.env.example` to `.env.local`.
3. Install dependencies with `pnpm install` or `npm install`.
4. Start the app with `pnpm dev` or `npm run dev`.

## Backend contract

The frontend is prepared for these FastAPI-style endpoints:

- `GET /api/v1/health`
- `POST /api/v1/match/resume-to-jobs`

Suggested multipart form fields for the match endpoint:

- `file`
- `target_role`
- `limit`
- `notes`

If the backend is not available, the UI falls back to mock data by default.
