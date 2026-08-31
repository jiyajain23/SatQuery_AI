"""Pre-authored responses when LLM is unavailable (MOCK_MODE=force|auto fallback)."""

from __future__ import annotations

from app.schemas import (
    AnalysisResult,
    AnswerPayload,
    ConfidenceFactor,
    RegionPayload,
    TaskPlan,
    ComparisonPlan,
)

ORANGE = "#ff4704"

BI_TEMPORAL_REGIONS = [
    RegionPayload(
        id="12-A",
        left="46%",
        top="22%",
        w="20%",
        h="22%",
        label="parcel 12-A",
        tone=ORANGE,
        fill="rgba(255,71,4,0.10)",
        side="left",
        ha="14.2 ha",
        drop="−3.1 dB radar · NDVI 0.71 → 0.49",
    ),
    RegionPayload(
        id="12-C",
        left="44%",
        top="56%",
        w="17%",
        h="18%",
        label="parcel 12-C",
        tone=ORANGE,
        fill="rgba(255,71,4,0.08)",
        side="left",
        ha="13.1 ha",
        drop="−2.6 dB radar · NDVI 0.70 → 0.53",
    ),
    RegionPayload(
        id="13-A",
        left="71%",
        top="38%",
        w="15%",
        h="17%",
        label="parcel 13-A",
        tone=ORANGE,
        fill="rgba(255,71,4,0.07)",
        side="right",
        ha="11.3 ha",
        drop="−2.4 dB radar · NDVI 0.72 → 0.55",
    ),
]

BI_TEMPORAL_ANSWER = AnswerPayload(
    headline="Yes. About 38.6 hectares of the block — roughly a third — has declined since June.",
    body=[
        "Cloud covered 61% of the optical photograph on 14 July, so radar carried the comparison. "
        "Radar returns dropped sharply over three neighbouring parcels in the north-east, the pattern "
        "you see when a crop is flattened or standing in water rather than harvested.",
        "On the clear 39% of the area, the optical scene agrees: vegetation vigour fell from 0.71 to 0.52 "
        "over the same parcels.",
    ],
    conf="0.89",
    confWord="high",
    factors=[
        ConfidenceFactor(
            name="Model certainty",
            value="0.91",
            note="Calibrated against held-out scenes, not a raw model score.",
        ),
        ConfidenceFactor(
            name="Agreement between the two readings",
            value="0.86",
            note="Radar and optical outline nearly the same area.",
        ),
        ConfidenceFactor(
            name="Input quality",
            value="0.94",
            note="Scenes aligned to 0.42 px; a penalty was applied for cloud.",
        ),
    ],
)

SINGLE_IMAGE_ANSWER = AnswerPayload(
    headline="The scene is dominated by irrigated paddy parcels with tree-lined field boundaries.",
    body=[
        "Rectangular green fields occupy most of the frame, consistent with active rice cultivation "
        "in the Krishna delta during the monsoon season.",
        "A narrow drainage channel runs along the eastern edge; built structures are limited to a "
        "small cluster in the south-west corner.",
    ],
    conf="0.84",
    confWord="high",
    factors=[
        ConfidenceFactor(
            name="Model certainty",
            value="0.87",
            note="Vision model confidence on clear optical imagery.",
        ),
        ConfidenceFactor(
            name="Agreement between the two readings",
            value="0.85",
            note="Single-sensor reading; agreement factor uses baseline prior.",
        ),
        ConfidenceFactor(
            name="Input quality",
            value="0.80",
            note="Moderate cloud cover on portions of the scene.",
        ),
    ],
)

SINGLE_IMAGE_REGIONS = [
    RegionPayload(
        id="field-1",
        left="20%",
        top="25%",
        w="35%",
        h="30%",
        label="paddy block A",
        tone=ORANGE,
        fill="rgba(4,71,255,0.08)",
        side="left",
        ha="~42 ha",
        drop="active cultivation",
    ),
]


def fallback_task_plan(image_count: int, goal: str, query: str) -> TaskPlan:
    if image_count >= 2:
        return TaskPlan(
            task_type="bitemporal_change",
            intent=goal or "crop_decline",
            specialists=["change_detect", "vision_vqa"],
            comparison=ComparisonPlan(baseline_index=0, current_index=1),
            output_format="parcels_with_ha",
            interpretation="Compare July against the June baseline and report decline by parcel.",
            reasoning=f"Fallback planner for bi-temporal query: {query[:80]}",
        )
    return TaskPlan(
        task_type="single_image_vqa",
        intent="scene_description",
        specialists=["vision_vqa"],
        output_format="narrative",
        interpretation="Describe land use and notable features in the single scene.",
        reasoning=f"Fallback planner for single-image query: {query[:80]}",
    )


def fallback_analysis(
    image_count: int,
    goal: str,
    query: str,
    regions: list[RegionPayload] | None = None,
) -> AnalysisResult:
    plan = fallback_task_plan(image_count, goal, query)
    if plan.task_type == "bitemporal_change":
        answer = BI_TEMPORAL_ANSWER
        regs = regions if regions else BI_TEMPORAL_REGIONS
        steps = [
            "Read the question and chose the comparison",
            "Compared radar against the June baseline",
            "Read the optical scene where it is clear of cloud",
            "Checked the two readings against each other",
            "Wrote the answer and drew the evidence",
        ]
    else:
        answer = SINGLE_IMAGE_ANSWER
        regs = regions if regions else SINGLE_IMAGE_REGIONS
        steps = [
            "Read the question and selected single-image VQA",
            "Analysed the optical scene with the vision model",
            "Extracted salient land-cover regions",
            "Wrote the answer and drew the evidence",
        ]

    return AnalysisResult(
        answer=answer,
        regions=regs,
        steps=steps,
        task_plan=plan,
        trace=[{"source": "fallback", "mock_mode": True}],
        meta={"used_fallback": True},
    )
