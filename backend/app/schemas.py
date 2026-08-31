from __future__ import annotations

from typing import Any, Literal

from pydantic import BaseModel, Field


class ValidationCheck(BaseModel):
    label: str
    plain: str
    value: str
    ok: bool


class ValidationResponse(BaseModel):
    passed: bool
    checks: list[ValidationCheck]
    failure_title: str | None = None
    failure_reasons: list[str] = Field(default_factory=list)
    alignment_offset_px: float | None = None
    image_count: int = 0


class ComparisonPlan(BaseModel):
    baseline_index: int = 0
    current_index: int = 1


class TaskPlan(BaseModel):
    task_type: Literal["bitemporal_change", "single_image_vqa"]
    intent: str
    specialists: list[str]
    comparison: ComparisonPlan | None = None
    output_format: str = "narrative"
    interpretation: str = ""
    reasoning: str = ""


class ConfidenceFactor(BaseModel):
    name: str
    value: str
    note: str


class AnswerPayload(BaseModel):
    isAnswer: bool = True
    headline: str
    body: list[str]
    conf: str
    confWord: str
    factors: list[ConfidenceFactor]


class RegionPayload(BaseModel):
    id: str
    left: str
    top: str
    w: str
    h: str
    label: str
    tone: str = "#ff4704"
    fill: str = "rgba(255,71,4,0.10)"
    side: Literal["left", "right"] = "left"
    ha: str = ""
    drop: str = ""


class PipelineStageEvent(BaseModel):
    stage: str
    label: str
    status: Literal["running", "done", "error"] = "running"
    index: int = 0


class JobStartResponse(BaseModel):
    job_id: str


class AnalysisResult(BaseModel):
    answer: AnswerPayload
    regions: list[RegionPayload]
    steps: list[str]
    task_plan: TaskPlan
    trace: list[dict[str, Any]] = Field(default_factory=list)
    meta: dict[str, Any] = Field(default_factory=dict)


class PlanPreviewRequest(BaseModel):
    query: str
    image_count: int = 2
    goal: str = "crop"


class PlanPreviewResponse(BaseModel):
    tokens: list[str]
    interpretation: str
    reasoning: str
    task_plan: TaskPlan | None = None
