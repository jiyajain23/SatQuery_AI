from __future__ import annotations

import asyncio
import uuid
from dataclasses import dataclass, field
from typing import Any, AsyncGenerator, Callable

from app.config import Settings, get_settings
from app.pipeline.aggregator import aggregate_confidence
from app.pipeline.fallback import fallback_analysis
from app.pipeline.planner import plan_query, synthesize_answer, single_image_vqa
from app.pipeline.specialists.change_detect import detect_changes
from app.pipeline.validator import validate_images
from app.schemas import AnalysisResult, ComparisonPlan, PipelineStageEvent

PIPELINE_STAGES = [
    ("Input Validator", "Validating imagery"),
    ("Input Validator", "Checking resolution and alignment"),
    ("Query Planner", "Planning the query"),
    ("Query Planner", "Selecting the analysis model"),
    ("Specialist Analysis", "Comparing satellite scenes"),
    ("Evidence Validator", "Validating evidence"),
    ("Confidence Aggregator", "Aggregating confidence"),
    ("Explainable Response", "Generating the response"),
]


@dataclass
class Job:
    id: str
    query: str
    goal: str
    aoi_hectares: float
    image_bytes: list[bytes]
    filenames: list[str]
    events: asyncio.Queue[PipelineStageEvent | None] = field(default_factory=asyncio.Queue)
    result: AnalysisResult | None = None
    error: str | None = None
    done: bool = False


_jobs: dict[str, Job] = {}


def create_job(
    query: str,
    goal: str,
    aoi_hectares: float,
    files: list[tuple[str, bytes]],
) -> Job:
    job_id = str(uuid.uuid4())
    job = Job(
        id=job_id,
        query=query,
        goal=goal,
        aoi_hectares=aoi_hectares,
        image_bytes=[data for _, data in files],
        filenames=[name for name, _ in files],
    )
    _jobs[job_id] = job
    return job


def get_job(job_id: str) -> Job | None:
    return _jobs.get(job_id)


async def _emit(job: Job, index: int, status: str = "running") -> None:
    stage, label = PIPELINE_STAGES[index]
    await job.events.put(
        PipelineStageEvent(stage=stage, label=label, status=status, index=index)
    )
    await asyncio.sleep(0.35)


async def run_job(job: Job, settings: Settings | None = None) -> None:
    settings = settings or get_settings()
    trace: list[dict[str, Any]] = []

    try:
        await _emit(job, 0)
        validation = validate_images(list(zip(job.filenames, job.image_bytes)), settings)
        trace.append({"stage": "validate", "passed": validation.passed})
        await _emit(job, 1, "done" if validation.passed else "error")

        if not validation.passed:
            job.error = validation.failure_title or "Validation failed"
            job.done = True
            await job.events.put(None)
            return

        await _emit(job, 2)
        plan = await plan_query(job.query, len(job.image_bytes), job.goal, settings)
        trace.append({"stage": "plan", "task_plan": plan.model_dump()})
        await _emit(job, 3, "done")

        await _emit(job, 4)
        regions = []
        change_fraction = 0.0
        answer = None
        steps: list[str] = []

        if plan.task_type == "bitemporal_change" and len(job.image_bytes) >= 2:
            comp = plan.comparison or ComparisonPlan(baseline_index=0, current_index=1)
            bi = comp.baseline_index
            ci = comp.current_index
            cd = detect_changes(
                job.image_bytes[bi],
                job.image_bytes[ci],
                aoi_hectares=job.aoi_hectares,
            )
            regions = cd.regions
            change_fraction = cd.change_fraction
            steps = [
                "Read the question and chose the comparison",
                "Ran OpenCV change detection between baseline and current",
                "Compared optical cues where cloud cover permits",
                "Cross-checked narrative against change regions",
                "Wrote the answer and drew the evidence",
            ]
            answer = await synthesize_answer(
                job.query,
                plan,
                regions,
                change_fraction,
                settings,
                [job.image_bytes[bi], job.image_bytes[ci]],
            )
        else:
            answer, regions = await single_image_vqa(
                job.query, job.image_bytes[0], settings
            )
            steps = [
                "Read the question and selected single-image VQA",
                "Analysed the scene with the vision model",
                "Mapped salient regions for evidence",
                "Wrote the grounded answer",
            ]

        trace.append(
            {
                "stage": "specialists",
                "region_count": len(regions),
                "change_fraction": change_fraction,
            }
        )
        await _emit(job, 5, "done")

        await _emit(job, 6)
        answer = aggregate_confidence(
            answer,
            regions,
            change_fraction,
            validation.alignment_offset_px,
        )
        await _emit(job, 7, "done")

        if settings.mock_mode == "force" and not trace[-1].get("region_count"):
            fb = fallback_analysis(len(job.image_bytes), job.goal, job.query, regions or None)
            answer = fb.answer
            regions = fb.regions
            steps = fb.steps

        job.result = AnalysisResult(
            answer=answer,
            regions=regions,
            steps=steps,
            task_plan=plan,
            trace=trace,
            meta={
                "change_fraction": change_fraction,
                "alignment_px": validation.alignment_offset_px,
                "filenames": job.filenames,
            },
        )
    except Exception as exc:
        job.error = str(exc)
        fb = fallback_analysis(len(job.image_bytes), job.goal, job.query)
        job.result = fb
        trace.append({"stage": "error", "message": str(exc), "used_fallback": True})
    finally:
        job.done = True
        await job.events.put(None)


async def subscribe_events(job_id: str) -> AsyncGenerator[str, None]:
    job = get_job(job_id)
    if not job:
        yield 'data: {"error":"job not found"}\n\n'
        return

    while True:
        event = await job.events.get()
        if event is None:
            yield 'data: {"done":true}\n\n'
            break
        yield f"data: {event.model_dump_json()}\n\n"
