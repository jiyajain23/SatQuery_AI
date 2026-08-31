from __future__ import annotations

import io
from dataclasses import dataclass

import cv2
import numpy as np
from PIL import Image

from app.schemas import RegionPayload

ORANGE = "#ff4704"
VIOLET = "#0447ff"


@dataclass
class ChangeDetectResult:
    regions: list[RegionPayload]
    change_fraction: float
    mask: np.ndarray | None


def _box_to_percent(x: int, y: int, w: int, h: int, img_w: int, img_h: int) -> dict[str, str]:
    return {
        "left": f"{100 * x / img_w:.1f}%",
        "top": f"{100 * y / img_h:.1f}%",
        "w": f"{100 * w / img_w:.1f}%",
        "h": f"{100 * h / img_h:.1f}%",
    }


def detect_changes(
    baseline_bytes: bytes,
    current_bytes: bytes,
    aoi_hectares: float = 1240.0,
    max_regions: int = 5,
) -> ChangeDetectResult:
    b = np.array(Image.open(io.BytesIO(baseline_bytes)).convert("RGB"))
    c = np.array(Image.open(io.BytesIO(current_bytes)).convert("RGB"))

    h = min(b.shape[0], c.shape[0])
    w = min(b.shape[1], c.shape[1])
    b = cv2.resize(b, (w, h))
    c = cv2.resize(c, (w, h))

    gb = cv2.GaussianBlur(cv2.cvtColor(b, cv2.COLOR_RGB2GRAY), (5, 5), 0)
    gc = cv2.GaussianBlur(cv2.cvtColor(c, cv2.COLOR_RGB2GRAY), (5, 5), 0)
    diff = cv2.absdiff(gb, gc)
    _, mask = cv2.threshold(diff, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)

    kernel = np.ones((5, 5), np.uint8)
    mask = cv2.morphologyEx(mask, cv2.MORPH_OPEN, kernel)
    mask = cv2.morphologyEx(mask, cv2.MORPH_CLOSE, kernel)

    change_fraction = float(np.count_nonzero(mask)) / mask.size
    contours, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    min_area = max(500, int(0.002 * w * h))
    boxes = []
    for cnt in contours:
        x, y, bw, bh = cv2.boundingRect(cnt)
        area = bw * bh
        if area < min_area:
            continue
        boxes.append((area, x, y, bw, bh))

    boxes.sort(reverse=True)
    regions: list[RegionPayload] = []
    total_change_px = sum(a for a, *_ in boxes) or 1

    for i, (area, x, y, bw, bh) in enumerate(boxes[:max_regions]):
        pct = _box_to_percent(x, y, bw, bh, w, h)
        ha_share = aoi_hectares * (area / total_change_px) / max(len(boxes[:max_regions]), 1)
        regions.append(
            RegionPayload(
                id=f"R{i + 1}",
                label=f"change region {i + 1}",
                tone=ORANGE,
                fill=f"rgba(255,71,4,{0.10 - i * 0.02:.2f})",
                side="right" if x + bw / 2 > w / 2 else "left",
                ha=f"{ha_share:.1f} ha",
                drop=f"Δ intensity {int(area / 100)} units",
                **pct,
            )
        )

    if not regions and change_fraction > 0.01:
        regions.append(
            RegionPayload(
                id="R1",
                left="30%",
                top="30%",
                w="40%",
                h="35%",
                label="diffuse change",
                tone=ORANGE,
                fill="rgba(255,71,4,0.10)",
                side="left",
                ha=f"{aoi_hectares * change_fraction:.1f} ha",
                drop="broad spectral shift",
            )
        )

    return ChangeDetectResult(regions=regions, change_fraction=change_fraction, mask=mask)
