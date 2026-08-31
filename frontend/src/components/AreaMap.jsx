import { MousePointerClick } from "lucide-react";

/**
 * Map: real satellite rate-map ground with a click-to-move AOI boundary box.
 */
export function AreaMap({ cx, cy, size, note, onPick, children }) {
  const half = size / 2;
  const clamp = (v) => Math.min(100 - half, Math.max(half, v));

  const handleClick = (e) => {
    const r = e.currentTarget.getBoundingClientRect();
    onPick({
      cx: clamp(((e.clientX - r.left) / r.width) * 100),
      cy: clamp(((e.clientY - r.top) / r.height) * 100),
    });
  };

  return (
    <div
      onClick={handleClick}
      className="sq-scene sq-scene--current"
      style={{
        position: "relative",
        height: 320,
        borderRadius: 20,
        overflow: "hidden",
        cursor: "crosshair",
      }}
    >
      <div
        style={{
          position: "absolute",
          left: `${clamp(cx) - half}%`,
          top: `${clamp(cy) - half}%`,
          width: `${size}%`,
          height: `${size}%`,
          border: "1.5px solid var(--sq-violet)",
          borderRadius: 4,
          background: "rgba(4,71,255,0.06)",
          transition:
            "left 0.15s ease, top 0.15s ease, width 0.15s ease, height 0.15s ease",
        }}
      />
      <span
        style={{
          position: "absolute",
          left: 20,
          top: 16,
          display: "inline-flex",
          alignItems: "center",
          gap: 8,
          fontSize: 14,
          letterSpacing: "0.14px",
          color: "var(--sq-ink-soft)",
          background: "rgba(253,252,252,0.86)",
          padding: "4px 12px",
          borderRadius: 9999,
        }}
      >
        <MousePointerClick size={14} strokeWidth={1.6} aria-hidden="true" />
        Click the map to move the boundary
      </span>
      {children}
      <span
        className="sq-mono"
        style={{
          position: "absolute",
          left: 20,
          bottom: 16,
          color: "var(--sq-muted)",
        }}
      >
        {note}
      </span>
    </div>
  );
}
