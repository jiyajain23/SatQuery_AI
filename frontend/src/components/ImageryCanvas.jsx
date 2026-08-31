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
          border: "1px solid rgba(255, 255, 255, 0.12)",
          boxShadow: "0 8px 32px rgba(0, 0, 0, 0.4)",
        }}
      >
        <img
          src="/demo/satellite_hero.jpg"
          alt="Current satellite scene"
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
            filter: "brightness(0.95) saturate(1.1)",
          }}
        />
        <div
          className="sq-scene sq-scene--baseline"
          style={{
            position: "absolute",
            inset: 0,
            clipPath: `inset(0 ${100 - swipe}% 0 0)`,
          }}
        >
          <img
            src="/demo/satellite_hero.jpg"
            alt="Baseline satellite scene"
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
              filter: "brightness(1.1) saturate(1.3) hue-rotate(10deg)",
            }}
          />
          <span
            className="sq-mono"
            style={{
              position: "absolute",
              left: 20,
              top: 16,
              color: "#93c5fd",
              background: "rgba(15, 23, 42, 0.85)",
              border: "1px solid rgba(147, 197, 253, 0.3)",
              padding: "4px 12px",
              borderRadius: 9999,
              backdropFilter: "blur(8px)",
              fontSize: 12,
            }}
          >
            T₁ · 2 June 2026 (Baseline)
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
              background: "rgba(255, 255, 255, 0.25)",
              border: "1.5px dashed rgba(255, 255, 255, 0.6)",
              clipPath: `inset(0 0 0 ${Math.max(0, (swipe - 6) / 0.56)}%)`,
              backdropFilter: "blur(2px)",
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
            width: 2,
            background: "var(--sq-cyan)",
            boxShadow: "0 0 16px var(--sq-cyan)",
            zIndex: 10,
          }}
        />
        <span
          className="sq-mono"
          style={{
            position: "absolute",
            right: 20,
            top: 16,
            color: "#67e8f9",
            background: "rgba(15, 23, 42, 0.85)",
            border: "1px solid rgba(103, 232, 249, 0.3)",
            padding: "4px 12px",
            borderRadius: 9999,
            backdropFilter: "blur(8px)",
            fontSize: 12,
          }}
        >
          T₂ · 14 July 2026 (Current)
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
              border: `2px solid ${r.tone}`,
              borderRadius: 6,
              background: hover === r.id ? "rgba(255,85,0,0.3)" : r.fill,
              boxShadow: `0 0 16px ${r.tone}40`,
              cursor: "pointer",
              transition: "all 0.2s ease",
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
                color: "#ffffff",
                background: "rgba(15, 23, 42, 0.9)",
                border: `1px solid ${r.tone}`,
                padding: "2px 8px",
                borderRadius: 9999,
                fontSize: 11,
                fontWeight: 600,
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
            accentColor: "#00f0ff",
            cursor: "ew-resize",
            zIndex: 15,
          }}
        />

        {hovered && (
          <div
            style={{
              position: "absolute",
              right: 20,
              bottom: 52,
              background: "rgba(15, 23, 42, 0.95)",
              border: "1px solid rgba(255, 85, 0, 0.4)",
              borderRadius: 16,
              padding: "16px 20px",
              display: "flex",
              flexDirection: "column",
              gap: 4,
              boxShadow: "0 8px 32px rgba(0, 0, 0, 0.5), 0 0 20px rgba(255, 85, 0, 0.2)",
              backdropFilter: "blur(12px)",
              zIndex: 20,
            }}
          >
            <span style={{ fontSize: 16, letterSpacing: "0.16px", color: "var(--sq-ink)", fontWeight: 600 }}>
              Parcel {hovered.id} · {hovered.ha}
            </span>
            <span className="sq-mono" style={{ color: "#38bdf8", fontSize: 12 }}>
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
              background: "rgba(7, 9, 14, 0.75)",
              backdropFilter: "blur(8px)",
              zIndex: 25,
            }}
          >
            <span
              className="sq-mono sq-pulse"
              style={{ color: "var(--sq-cyan)", fontSize: 14, fontWeight: 600 }}
            >
              FUSING CHANNELS & EXTRACTING EVIDENCE…
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
            background: "rgba(15, 23, 42, 0.85)",
            border: "1px solid var(--sq-rule)",
            padding: "4px 12px",
            borderRadius: 9999,
            backdropFilter: "blur(8px)",
            fontSize: 12,
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
