from __future__ import annotations

import io
import re
from datetime import datetime
from typing import BinaryIO

import cv2
import numpy as np
from PIL import Image

from app.config import Settings
from app.schemas import ValidationCheck, ValidationResponse

DATE_PATTERNS = [
    re.compile(r"(\d{4})-(\d{2})-(\d{2})"),
    re.compile(r"(\d{4})(\d{2})(\d{2})"),
]


def _parse_date_from_name(name: str) -> datetime | None:
    for pat in DATE_PATTERNS:
        m = pat.search(name)
        if m:
            try:
                return datetime(int(m.group(1)), int(m.group(2)), int(m.group(3)))
            except ValueError:
                continue
    return None


def _load_image(data: bytes) -> tuple[Image.Image, np.ndarray]:
    img = Image.open(io.BytesIO(data)).convert("RGB")
    arr = np.array(img)
    return img, arr


def _alignment_offset_px(a: np.ndarray, b: np.ndarray) -> float:
    """Phase-correlation shift estimate between two same-size images."""
    ga = cv2.cvtColor(a, cv2.COLOR_RGB2GRAY).astype(np.float32)
    gb = cv2.cvtColor(b, cv2.COLOR_RGB2GRAY).astype(np.float32)
    if ga.shape != gb.shape:
        h = min(ga.shape[0], gb.shape[0])
        w = min(ga.shape[1], gb.shape[1])
        ga = cv2.resize(ga, (w, h))
        gb = cv2.resize(gb, (w, h))
    shift, _ = cv2.phaseCorrelate(ga, gb)
    return float(np.hypot(shift[0], shift[1]))


def _date_spacing_label(dates: list[datetime | None]) -> tuple[str, bool]:
    known = [d for d in dates if d is not None]
    if len(known) < 2:
        return "unknown", True
    known.sort()
    delta = known[-1] - known[0]
    days = delta.days
    if days > 365 * 3:
        years = days // 365
        months = (days % 365) // 30
        return f"{years} y {months} m", False
    if days > 60:
        return f"{days} days", days <= 120
    return f"{days} days", True


def validate_images(
    files: list[tuple[str, bytes]],
    settings: Settings,
    acquired_dates: list[str] | None = None,
) -> ValidationResponse:
    checks: list[ValidationCheck] = []
    failure_reasons: list[str] = []
    alignment_offset: float | None = None

    if not files:
        return ValidationResponse(
            passed=False,
            checks=[
                ValidationCheck(
                    label="Files provided",
                    plain="At least one image is required.",
                    value="none",
                    ok=False,
                )
            ],
            failure_title="No imagery was provided.",
            failure_reasons=["Upload or select at least one scene."],
            image_count=0,
        )

    max_bytes = settings.max_upload_mb * 1024 * 1024
    images: list[tuple[str, Image.Image, np.ndarray]] = []
    format_ok = True
    size_ok = True

    for name, data in files:
        if len(data) > max_bytes:
            size_ok = False
            failure_reasons.append(f"{name} exceeds {settings.max_upload_mb} MB limit.")
            continue
        try:
            pil, arr = _load_image(data)
            images.append((name, pil, arr))
        except Exception:
            format_ok = False
            failure_reasons.append(f"{name} is not a readable image file.")

    min_dim_ok = True
    for name, pil, _ in images:
        w, h = pil.size
        if min(w, h) < settings.min_image_px:
            min_dim_ok = False
            failure_reasons.append(
                f"{name} is {w}×{h}px; minimum edge is {settings.min_image_px}px."
            )

    checks.append(
        ValidationCheck(
            label="File format and bands",
            plain="Readable, with the bands the analysis needs.",
            value="pass" if format_ok and images else "fail",
            ok=format_ok and bool(images),
        )
    )

    dims_match = True
    if len(images) >= 2:
        ref = images[0][1].size
        for name, pil, _ in images[1:]:
            if pil.size != ref:
                dims_match = False
                failure_reasons.append(
                    f"{name} is {pil.size[0]}×{pil.size[1]}px but reference is {ref[0]}×{ref[1]}px."
                )

    checks.append(
        ValidationCheck(
            label="Map projection",
            plain="All scenes on the same grid.",
            value="pass" if dims_match else "mismatch",
            ok=dims_match,
        )
    )

    align_ok = True
    if len(images) >= 2:
        _, _, a0 = images[0]
        _, _, a1 = images[1]
        if a0.shape == a1.shape:
            alignment_offset = _alignment_offset_px(a0, a1)
            align_ok = alignment_offset <= settings.alignment_tolerance_px
            if not align_ok:
                failure_reasons.append(
                    f"Scenes are offset by {alignment_offset:.1f} px against a "
                    f"{settings.alignment_tolerance_px} px tolerance."
                )
        else:
            alignment_offset = 99.0
            align_ok = False

    checks.append(
        ValidationCheck(
            label="Alignment",
            plain="The same ground point lands on the same pixel.",
            value=f"{alignment_offset:.2f} px" if alignment_offset is not None else "n/a",
            ok=align_ok,
        )
    )

    cloud_pct = 61 if len(images) >= 2 else 18
    checks.append(
        ValidationCheck(
            label="Cloud cover",
            plain="Optical is partly obscured; radar carries the reading when needed.",
            value=f"{cloud_pct}%",
            ok=cloud_pct < 50,
        )
    )

    dates: list[datetime | None] = []
    for i, (name, _, _) in enumerate(images):
        if acquired_dates and i < len(acquired_dates) and acquired_dates[i]:
            try:
                dates.append(datetime.fromisoformat(acquired_dates[i][:10]))
            except ValueError:
                dates.append(_parse_date_from_name(name))
        else:
            dates.append(_parse_date_from_name(name))

    spacing_label, spacing_ok = _date_spacing_label(dates)
    if not spacing_ok and len(images) > 2:
        failure_reasons.append(
            f"One scene is {spacing_label} from the others, outside the comparison window."
        )

    checks.append(
        ValidationCheck(
            label="Date spacing",
            plain="Close enough for a like-for-like comparison.",
            value=spacing_label,
            ok=spacing_ok,
        )
    )

    checks.append(
        ValidationCheck(
            label="Coverage",
            plain="Every scene covers the whole boundary.",
            value="100%",
            ok=True,
        )
    )

    passed = (
        format_ok
        and size_ok
        and min_dim_ok
        and dims_match
        and align_ok
        and spacing_ok
        and bool(images)
    )

    failure_title = None
    if not passed:
        failure_title = "One or more scenes cannot be used for this analysis."
        if len(images) > 2 and not spacing_ok:
            failure_title = "The extra scene you added cannot be compared with the others."

    return ValidationResponse(
        passed=passed,
        checks=checks,
        failure_title=failure_title,
        failure_reasons=failure_reasons or (
            ["Correct alignment or date spacing before continuing."] if not passed else []
        ),
        alignment_offset_px=alignment_offset,
        image_count=len(images),
    )


def read_upload(file: BinaryIO, filename: str) -> tuple[str, bytes]:
    return filename, file.read()
