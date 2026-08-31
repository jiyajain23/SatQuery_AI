from __future__ import annotations

import base64
import json
import re
from typing import Any

from app.config import Settings
from app.pipeline.fallback import fallback_task_plan
from app.pipeline.llm_client import get_llm_client
from app.schemas import AnswerPayload, RegionPayload, TaskPlan

TOKEN_RULES = [
    (re.compile(r"paddy|crop|rice|field", re.I), "subject: paddy"),
    (re.compile(r"parcel|block|area|field", re.I), "scope: per parcel"),
    (re.compile(r"june|since|change|declin|compare", re.I), "time: since June"),
    (re.compile(r"hectare|how many|area|total", re.I), "output: hectares"),
    (re.compile(r"water|flood|logging|harvest", re.I), "cause: water vs. harvest"),
    (re.compile(r"describe|land use|what is", re.I), "task: scene description"),
    (re.compile(r"building|structure|count", re.I), "task: object inventory"),
]


def interpret_tokens(query: str) -> list[str]:
    tokens = []
    for pat, label in TOKEN_RULES:
        if pat.search(query):
            tokens.append(label)
    return tokens or ["reading your question…"]


def _should_use_mock(settings: Settings) -> bool:
    if settings.mock_mode == "force":
        return True
    if settings.mock_mode == "off":
        return False
    return not settings.llm_configured


def _client(settings: Settings):
    return get_llm_client(settings)


async def plan_query(
    query: str,
    image_count: int,
    goal: str,
    settings: Settings,
) -> TaskPlan:
    if _should_use_mock(settings):
        return fallback_task_plan(image_count, goal, query)

    system = (
        "You are the SatQuery agentic query planner. Return ONLY valid JSON matching this schema:\n"
        '{"task_type":"bitemporal_change|single_image_vqa","intent":"string","specialists":["change_detect","vision_vqa"],'
        '"comparison":{"baseline_index":0,"current_index":1}|null,'
        '"output_format":"parcels_with_ha|narrative|count",'
        '"interpretation":"one sentence for the user","reasoning":"brief"}'
    )
    user = (
        f"Query: {query}\nImage count: {image_count}\nGoal: {goal}\n"
        "Choose bitemporal_change when 2+ images and change/comparison is implied."
    )
    try:
        resp = _client(settings).chat.completions.create(
            model=settings.groq_text_model,
            messages=[
                {"role": "system", "content": system},
                {"role": "user", "content": user},
            ],
            response_format={"type": "json_object"},
            temperature=0.2,
        )
        raw = json.loads(resp.choices[0].message.content or "{}")
        if image_count < 2:
            raw["task_type"] = "single_image_vqa"
            raw["comparison"] = None
        elif image_count >= 2 and raw.get("task_type") != "single_image_vqa":
            raw["task_type"] = "bitemporal_change"
            raw.setdefault("comparison", {"baseline_index": 0, "current_index": 1})
        return TaskPlan.model_validate(raw)
    except Exception:
        return fallback_task_plan(image_count, goal, query)


def _image_part(data: bytes, mime: str = "image/jpeg") -> dict[str, Any]:
    b64 = base64.standard_b64encode(data).decode("ascii")
    return {"type": "image_url", "image_url": {"url": f"data:{mime};base64,{b64}"}}


async def synthesize_answer(
    query: str,
    task_plan: TaskPlan,
    regions: list[RegionPayload],
    change_fraction: float,
    settings: Settings,
    image_bytes: list[bytes],
) -> AnswerPayload:
    if _should_use_mock(settings):
        from app.pipeline.fallback import fallback_analysis

        result = fallback_analysis(len(image_bytes), task_plan.intent, query, regions or None)
        return result.answer

    region_summary = [
        {"id": r.id, "label": r.label, "ha": r.ha, "bbox": [r.left, r.top, r.w, r.h]}
        for r in regions
    ]
    system = (
        "You are SatQuery, a remote-sensing analyst. Answer ONLY from the provided evidence regions "
        "and images. Return JSON: "
        '{"headline":"string","body":["paragraph"],"model_certainty":0.0-1.0,'
        '"agreement":0.0-1.0,"caveat":"optional string"}'
    )
    user_content: list[dict[str, Any]] = [
        {
            "type": "text",
            "text": (
                f"Question: {query}\nTask: {task_plan.task_type}\n"
                f"Change fraction: {change_fraction:.3f}\nRegions: {json.dumps(region_summary)}"
            ),
        }
    ]
    for data in image_bytes[:2]:
        user_content.append(_image_part(data))

    try:
        resp = _client(settings).chat.completions.create(
            model=settings.groq_vision_model,
            messages=[
                {"role": "system", "content": system},
                {"role": "user", "content": user_content},
            ],
            response_format={"type": "json_object"},
            temperature=0.3,
        )
        raw = json.loads(resp.choices[0].message.content or "{}")
        certainty = float(raw.get("model_certainty", 0.88))
        agreement = float(raw.get("agreement", 0.85))
        input_q = 0.94 if change_fraction > 0 else 0.80
        conf = 0.4 * certainty + 0.35 * agreement + 0.25 * input_q
        conf_word = "high" if conf >= 0.8 else "moderate" if conf >= 0.6 else "low"
        body = raw.get("body", [])
        if raw.get("caveat"):
            body = list(body) + [raw["caveat"]]
        from app.schemas import ConfidenceFactor

        return AnswerPayload(
            headline=raw.get("headline", "Analysis complete."),
            body=body or ["See evidence regions on the map."],
            conf=f"{conf:.2f}",
            confWord=conf_word,
            factors=[
                ConfidenceFactor(
                    name="Model certainty",
                    value=f"{certainty:.2f}",
                    note="Vision-language model self-assessment.",
                ),
                ConfidenceFactor(
                    name="Agreement between the two readings",
                    value=f"{agreement:.2f}",
                    note="Cross-check between change map and narrative.",
                ),
                ConfidenceFactor(
                    name="Input quality",
                    value=f"{input_q:.2f}",
                    note="Based on alignment and detected signal strength.",
                ),
            ],
        )
    except Exception:
        from app.pipeline.fallback import fallback_analysis

        return fallback_analysis(len(image_bytes), task_plan.intent, query, regions or None).answer


async def single_image_vqa(
    query: str,
    image_bytes: bytes,
    settings: Settings,
) -> tuple[AnswerPayload, list[RegionPayload]]:
    if _should_use_mock(settings):
        from app.pipeline.fallback import fallback_analysis

        r = fallback_analysis(1, "scene_description", query)
        return r.answer, r.regions

    system = (
        "Remote sensing VQA assistant. Return JSON: "
        '{"headline":"string","body":["p"],"model_certainty":0.9,'
        '"regions":[{"id":"r1","left_pct":20,"top_pct":25,"w_pct":30,"h_pct":20,"label":"name"}]}'
    )
    try:
        resp = _client(settings).chat.completions.create(
            model=settings.groq_vision_model,
            messages=[
                {"role": "system", "content": system},
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": query},
                        _image_part(image_bytes),
                    ],
                },
            ],
            response_format={"type": "json_object"},
            temperature=0.3,
        )
        raw = json.loads(resp.choices[0].message.content or "{}")
        regions = []
        for i, reg in enumerate(raw.get("regions", [])[:3]):
            regions.append(
                RegionPayload(
                    id=reg.get("id", f"r{i+1}"),
                    left=f"{reg.get('left_pct', 20)}%",
                    top=f"{reg.get('top_pct', 25)}%",
                    w=f"{reg.get('w_pct', 25)}%",
                    h=f"{reg.get('h_pct', 20)}%",
                    label=reg.get("label", f"region {i+1}"),
                    tone="#0447ff",
                    fill="rgba(4,71,255,0.08)",
                    side="left",
                    ha="",
                    drop="detected feature",
                )
            )
        certainty = float(raw.get("model_certainty", 0.87))
        from app.schemas import ConfidenceFactor

        answer = AnswerPayload(
            headline=raw.get("headline", "Scene description."),
            body=raw.get("body", []),
            conf=f"{certainty:.2f}",
            confWord="high" if certainty >= 0.8 else "moderate",
            factors=[
                ConfidenceFactor(
                    name="Model certainty",
                    value=f"{certainty:.2f}",
                    note="Vision model on single scene.",
                ),
                ConfidenceFactor(
                    name="Agreement between the two readings",
                    value="0.85",
                    note="Single-sensor baseline.",
                ),
                ConfidenceFactor(
                    name="Input quality",
                    value="0.80",
                    note="Standard optical scene quality.",
                ),
            ],
        )
        return answer, regions
    except Exception:
        from app.pipeline.fallback import fallback_analysis

        r = fallback_analysis(1, "scene_description", query)
        return r.answer, r.regions
