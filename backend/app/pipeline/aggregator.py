from __future__ import annotations

from app.schemas import AnswerPayload, RegionPayload


def aggregate_confidence(
    answer: AnswerPayload,
    regions: list[RegionPayload],
    change_fraction: float,
    alignment_px: float | None,
) -> AnswerPayload:
    """Hallucination guard: penalize agreement if narrative claims change but mask is weak."""
    factors = {f.name: f for f in answer.factors}
    agreement = factors.get("Agreement between the two readings")
    if agreement:
        try:
            ag = float(agreement.value)
        except ValueError:
            ag = 0.85

        claims_change = any(
            w in answer.headline.lower()
            for w in ("yes", "declined", "change", "increased", "decreased", "lost")
        )
        weak_signal = change_fraction < 0.02 and len(regions) == 0
        strong_signal = change_fraction > 0.05 or len(regions) >= 2

        if claims_change and weak_signal:
            ag = min(ag, 0.55)
            if answer.body:
                answer.body = list(answer.body) + [
                    "Note: detected pixel change is limited; interpret with caution."
                ]
        elif claims_change and strong_signal:
            ag = max(ag, 0.82)

        agreement.value = f"{ag:.2f}"

    if alignment_px is not None and alignment_px > 1.0:
        iq = factors.get("Input quality")
        if iq:
            penalty = max(0.5, 1.0 - alignment_px / 10)
            try:
                iq_val = float(iq.value) * penalty
            except ValueError:
                iq_val = 0.7
            iq.value = f"{iq_val:.2f}"

    vals = []
    for f in answer.factors:
        try:
            vals.append(float(f.value))
        except ValueError:
            vals.append(0.8)
    conf = sum(vals) / len(vals) if vals else 0.8
    answer.conf = f"{conf:.2f}"
    answer.confWord = "high" if conf >= 0.8 else "moderate" if conf >= 0.6 else "low"
    return answer
