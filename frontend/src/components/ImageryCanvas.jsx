import { Cloud, Radio, SquareDashed } from "lucide-react";
import { LEGEND } from "@/data/mockData";
import { Pill } from "@/components/Pill";

const LAYER_ICONS = { optical: Cloud, radar: Radio, affected: SquareDashed };

/**
 * Answer-screen canvas: before/after swipe over hatched scenes, radar wash,
 * cloud mask, evidence boxes with hover read-out, and the legend.
 */
export function ImageryCanvas({
  layers,
  onToggleLayer,
  swipe,
  onSwipe,
  regions,
  hover,
  onHover,
  running,
  meta,
  caption,
}) {
  const hovered = regions.find((r) => r.id === hover);

  return (
    <section
      className="sq-pad"
      style={{
        display: "flex",
        flexDirection: "column",
        minHeight: 0,
        padding: 40,
        gap: 16,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          flexWrap: "wrap",
        }}
      >
        {[
          { key: "optical", label: "Cloud" },
          { key: "radar", label: "Radar" },
          { key: "affected", label: "Affected areas" },
        ].map((l) => {
          const Icon = LAYER_ICONS[l.key];
          return (
            <Pill
              key={l.key}
              selected={layers[l.key]}
              onClick={() => onToggleLayer(l.key)}
              style={{ padding: "7px 16px" }}
            >
              <Icon size={14} strokeWidth={1.6} aria-hidden="true" />
              {l.label}
            </Pill>
          );
        })}
        <div style={{ flex: 1 }} />
        <span className="sq-mono" style={{ color: "var(--sq-faint)" }}>
          {meta}
        </span>
      </div>

      <div
        className="sq-scene sq-scene--current"
        style={{
          position: "relative",
          flex: 1,
          minHeight: 320,
          borderRadius: 24,
          overflow: "hidden",
        }}
      >
        <div
          className="sq-scene sq-scene--baseline"
          style={{
            position: "absolute",
            inset: 0,
            clipPath: `inset(0 ${100 - swipe}% 0 0)`,
          }}
        >
          <span
            className="sq-mono"
            style={{
              position: "absolute",
              left: 20,
              top: 16,
              color: "var(--sq-ink-soft)",
              background: "rgba(253,252,252,0.86)",
              padding: "3px 10px",
              borderRadius: 9999,
            }}
          >
            2 June
          </span>
        </div>

        {layers.optical && (
          <div
            style={{
              position: "absolute",
              left: "6%",
              top: "12%",
              width: "56%",
              height: "54%",
              borderRadius: "44% 56% 46% 60%",
              background: "rgba(253,252,252,0.72)",
              border: "1px dashed var(--sq-faint)",
              clipPath: `inset(0 0 0 ${Math.max(0, (swipe - 6) / 0.56)}%)`,
            }}
          />
        )}

        {layers.radar && (
          <div className="sq-radar-wash" style={{ position: "absolute", inset: 0 }} />
        )}

        <div
          style={{
            position: "absolute",
            left: `${swipe}%`,
            top: 0,
            bottom: 0,
            width: 1,
            background: "var(--sq-ink)",
          }}
        />
        <span
          className="sq-mono"
          style={{
            position: "absolute",
            right: 20,
            top: 16,
            color: "var(--sq-ink-soft)",
            background: "rgba(253,252,252,0.86)",
            padding: "3px 10px",
            borderRadius: 9999,
          }}
        >
          14 July
        </span>

        {regions.map((r) => (
          <div
            key={r.id}
            onMouseEnter={() => onHover(r.id)}
            onMouseLeave={() => onHover(null)}
            style={{
              position: "absolute",
              left: r.left,
              top: r.top,
              width: r.w,
              height: r.h,
              border: `1.5px solid ${r.tone}`,
              borderRadius: 4,
              background: hover === r.id ? "rgba(255,71,4,0.22)" : r.fill,
              cursor: "default",
              transition: "background 0.15s ease",
            }}
          >
            <span
              className="sq-mono"
              style={{
                position: "absolute",
                left: r.side === "right" ? "auto" : 0,
                right: r.side === "right" ? 0 : "auto",
                top: -24,
                whiteSpace: "nowrap",
                color: r.tone,
                background: "var(--sq-bg)",
                padding: "1px 6px",
                borderRadius: 9999,
              }}
            >
              {r.label}
            </span>
          </div>
        ))}

        <input
          type="range"
          min="0"
          max="100"
          value={swipe}
          onChange={(e) => onSwipe(Number(e.target.value))}
          aria-label="Compare June and July"
          style={{
            position: "absolute",
            left: 20,
            right: 20,
            bottom: 52,
            width: "auto",
            accentColor: "#000",
            cursor: "ew-resize",
          }}
        />

        {hovered && (
          <div
            style={{
              position: "absolute",
              right: 20,
              bottom: 52,
              background: "var(--sq-bg)",
              borderRadius: 16,
              padding: "16px 20px",
              display: "flex",
              flexDirection: "column",
              gap: 4,
              boxShadow:
                "rgba(0,0,0,0.4) 0px 0px 1px 0px, rgba(0,0,0,0.04) 0px 2px 4px 0px",
            }}
          >
            <span style={{ fontSize: 16, letterSpacing: "0.16px" }}>
              Parcel {hovered.id} · {hovered.ha}
            </span>
            <span className="sq-mono" style={{ color: "var(--sq-muted)" }}>
              {hovered.drop}
            </span>
          </div>
        )}

        {running && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "grid",
              placeItems: "center",
              background: "rgba(253,252,252,0.6)",
            }}
          >
            <span
              className="sq-mono sq-pulse"
              style={{ color: "var(--sq-muted)" }}
            >
              analysing…
            </span>
          </div>
        )}

        <span
          className="sq-mono"
          style={{
            position: "absolute",
            left: 20,
            bottom: 16,
            color: "var(--sq-ink-soft)",
            background: "rgba(253,252,252,0.86)",
            padding: "3px 10px",
            borderRadius: 9999,
          }}
        >
          {caption}
        </span>
      </div>

      <div style={{ display: "flex", gap: 32, flexWrap: "wrap" }}>
        {LEGEND.map((l) => (
          <span
            key={l.text}
            style={{
              display: "flex",
              alignItems: "baseline",
              gap: 10,
              fontSize: 14,
              letterSpacing: "0.14px",
              color: "var(--sq-muted)",
            }}
          >
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: 2,
                background: l.tone,
              }}
            />
            {l.text}
          </span>
        ))}
      </div>
    </section>
  );
}
