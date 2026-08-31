from __future__ import annotations

import asyncio
from pathlib import Path

from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from sse_starlette.sse import EventSourceResponse

from app.config import get_settings
from app.pipeline.orchestrator import create_job, get_job, run_job, subscribe_events
from app.pipeline.planner import interpret_tokens, plan_query
from app.pipeline.validator import validate_images
from app.schemas import (
    JobStartResponse,
    PlanPreviewRequest,
    PlanPreviewResponse,
    ValidationResponse,
)

app = FastAPI(title="SatQuery AI", version="0.1.0")
settings = get_settings()

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DEMO_DIR = Path(__file__).resolve().parent.parent / "demo_data"
PUBLIC_DEMO = Path(__file__).resolve().parent.parent.parent / "frontend" / "public" / "demo"

if DEMO_DIR.exists():
    app.mount("/demo", StaticFiles(directory=str(DEMO_DIR)), name="demo")


@app.get("/api/health")
def health():
    return {
        "status": "ok",
        "mock_mode": settings.mock_mode,
        "llm": "groq" if settings.llm_configured else "fallback",
    }


@app.post("/api/validate", response_model=ValidationResponse)
async def validate_endpoint(
    files: list[UploadFile] = File(...),
    acquired_dates: str = Form(""),
):
    dates = [d.strip() for d in acquired_dates.split(",") if d.strip()] if acquired_dates else None
    payloads = []
    for f in files:
        payloads.append((f.filename or "image.jpg", await f.read()))
    return validate_images(payloads, settings, dates)


@app.post("/api/plan/preview", response_model=PlanPreviewResponse)
async def plan_preview(body: PlanPreviewRequest):
    tokens = interpret_tokens(body.query)
    plan = await plan_query(body.query, body.image_count, body.goal, settings)
    return PlanPreviewResponse(
        tokens=tokens,
        interpretation=plan.interpretation,
        reasoning=plan.reasoning,
        task_plan=plan,
    )


@app.post("/api/analyze", response_model=JobStartResponse)
async def analyze(
    query: str = Form(...),
    goal: str = Form("crop"),
    aoi_hectares: float = Form(1240.0),
    files: list[UploadFile] = File(...),
):
    if not query.strip():
        raise HTTPException(400, "Query is required")
    payloads = []
    for f in files:
        payloads.append((f.filename or "image.jpg", await f.read()))
    if not payloads:
        raise HTTPException(400, "At least one image is required")

    job = create_job(query.strip(), goal, aoi_hectares, payloads)
    asyncio.create_task(run_job(job, settings))
    return JobStartResponse(job_id=job.id)


@app.get("/api/jobs/{job_id}/events")
async def job_events(job_id: str):
    if not get_job(job_id):
        raise HTTPException(404, "Job not found")
    return EventSourceResponse(subscribe_events(job_id))


@app.get("/api/jobs/{job_id}/result")
async def job_result(job_id: str):
    job = get_job(job_id)
    if not job:
        raise HTTPException(404, "Job not found")
    if not job.done:
        return {"status": "running"}
    if job.error and not job.result:
        raise HTTPException(400, job.error)
    return job.result.model_dump() if job.result else {"status": "error", "error": job.error}


@app.get("/api/demo/{filename}")
async def demo_file(filename: str):
    for base in (PUBLIC_DEMO, DEMO_DIR):
        path = base / filename
        if path.exists() and path.is_file():
            return FileResponse(path)
    raise HTTPException(404, "Demo file not found")
