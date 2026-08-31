"""Generate synthetic demo satellite-style images for the MVP."""

from pathlib import Path

import cv2
import numpy as np

ROOT = Path(__file__).resolve().parents[2]
OUT_DIRS = [
    ROOT / "backend" / "demo_data",
    ROOT / "frontend" / "public" / "demo",
]


def _field_scene(seed: int, darken_patches: bool = False) -> np.ndarray:
    rng = np.random.default_rng(seed)
    h, w = 800, 800
    img = np.zeros((h, w, 3), dtype=np.uint8)
    img[:, :] = (34, 90, 42)

    for i in range(6):
        x0 = int(rng.integers(40, w - 200))
        y0 = int(rng.integers(40, h - 200))
        x1 = x0 + int(rng.integers(120, 220))
        y1 = y0 + int(rng.integers(100, 180))
        color = (
            int(rng.integers(20, 60)),
            int(rng.integers(100, 150)),
            int(rng.integers(30, 70)),
        )
        if darken_patches and i < 3:
            color = (int(color[0] * 0.55), int(color[1] * 0.55), int(color[2] * 0.55))
        cv2.rectangle(img, (x0, y0), (x1, y1), color, -1)
        cv2.rectangle(img, (x0, y0), (x1, y1), (20, 50, 25), 2)

    cv2.line(img, (650, 0), (680, h), (180, 200, 220), 8)
    noise = rng.integers(0, 12, img.shape, dtype=np.uint8)
    img = np.clip(img.astype(np.int16) + noise, 0, 255).astype(np.uint8)
    return img


def main():
    baseline = _field_scene(42, darken_patches=False)
    current = _field_scene(42, darken_patches=True)
    misaligned = cv2.resize(_field_scene(99), (620, 720))

    files = {
        "baseline_2026-06-02.jpg": baseline,
        "current_2026-07-14.jpg": current,
        "misaligned_2019.jpg": misaligned,
        "scene-baseline.png": baseline,
        "scene-current.png": current,
    }

    for out_dir in OUT_DIRS:
        out_dir.mkdir(parents=True, exist_ok=True)
        for name, arr in files.items():
            bgr = cv2.cvtColor(arr, cv2.COLOR_RGB2BGR)
            cv2.imwrite(str(out_dir / name), bgr)

    print("Wrote demo images to", OUT_DIRS)


if __name__ == "__main__":
    main()
