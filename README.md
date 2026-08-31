# SatQuery AI — MVP

Agentic, evidence-grounded remote-sensing assistant. Monorepo layout:

```
SatQuery/
├── frontend/   React + TanStack Start UI
└── backend/    FastAPI pipeline (validation, OpenCV, Groq LLM)
```

## Quick start

### 1. Backend (terminal 1)

```sh
cd backend
python -m venv venv
venv/Scripts/Activate.ps1
pip install -r requirements.txt
python scripts/generate_demo_images.py   # creates frontend/public/demo assets
copy .env.example .env                   # set GROQ_API_KEY
python -m uvicorn app.main:app --reload --port 8000
```

### 2. Frontend (terminal 2)

```sh
cd frontend
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) — the Vite dev server proxies `/api` to port 8000.

## Groq setup

1. Create a free API key at [console.groq.com](https://console.groq.com)
2. Add to `backend/.env`:

```env
GROQ_API_KEY=gsk_...
MOCK_MODE=auto
```


| Variable            | Default                   | Purpose                                                                 |
| ------------------- | ------------------------- | ----------------------------------------------------------------------- |
| `GROQ_API_KEY`      | (empty)                   | Enables live planner + vision VQA                                       |
| `GROQ_TEXT_MODEL`   | `llama-3.3-70b-versatile` | Query planner (JSON task plan)                                          |
| `GROQ_VISION_MODEL` | `qwen/qwen3.6-27b`        | Bi-temporal synthesis + single-image VQA                                |
| `MOCK_MODE`         | `auto`                    | `auto` = fallback if no key; `force` = always mock; `off` = require API |


Groq uses an OpenAI-compatible API (`https://api.groq.com/openai/v1`), so no separate SDK is needed.

Without a Groq key, the pipeline still runs real validation and OpenCV change detection, then uses pre-authored fallback answers.

## Demo paths


| Path             | Imagery step                         | Example question                                   |
| ---------------- | ------------------------------------ | -------------------------------------------------- |
| **Bi-temporal**  | Default demo (June + July pair)      | "Has the paddy in this block declined since June?" |
| **Single-image** | Click "Single-image demo" on Imagery | "Describe land use in this area"                   |
| **Validator**    | Click "Add a scene of my own"        | Shows real alignment/date rejection                |


## Architecture

```
frontend/  →  /api/validate | /api/analyze | /api/jobs/{id}/events (SSE)
                  ↓
           Input Validator → Groq Planner → Specialists → Aggregator → Response
```

## Docker (optional)

```sh
docker compose up
```

## Built with

- **Frontend:** TanStack Start, React, Tailwind (`frontend/`)
- **Backend:** FastAPI, OpenCV, Pillow, Groq via OpenAI SDK (`backend/`)

