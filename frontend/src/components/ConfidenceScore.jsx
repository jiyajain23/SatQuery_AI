import { ShieldCheck, Info } from "lucide-react";

/** Confidence panel with animated circular progress ring and scoring breakdown. */
export function ConfidenceScore({ value, word, factors = [], open, onToggle }) {
  const numericVal = parseFloat(value) || 0.85;
  const pct = Math.round(numericVal * 100);

  // SVG circle calculations
  const radius = 24;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (numericVal * circumference);

  const ringColor =
    numericVal >= 0.8 ? "#34d399" : numericVal >= 0.6 ? "#fbbf24" : "#f87171";

  const badgeBg =
    numericVal >= 0.8
      ? "rgba(16, 185, 129, 0.15)"
      : numericVal >= 0.6
        ? "rgba(251, 191, 36, 0.15)"
        : "rgba(248, 113, 113, 0.15)";

  return (
    <div
      className="sq-panel"
      style={{
        padding: "24px 28px",
        display: "flex",
        flexDirection: "column",
        gap: 18,
        border: "1px solid var(--sq-rule)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        {/* Animated SVG circular ring */}
        <div style={{ position: "relative", width: 56, height: 56, flexShrink: 0 }}>
          <svg width="56" height="56" style={{ transform: "rotate(-90deg)" }}>
            <circle
              cx="28"
              cy="28"
              r={radius}
              stroke="rgba(255, 255, 255, 0.08)"
              strokeWidth="5"
              fill="transparent"
            />
            <circle
              cx="28"
              cy="28"
              r={radius}
              stroke={ringColor}
              strokeWidth="5"
              fill="transparent"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              style={{
                transition: "stroke-dashoffset 0.8s cubic-bezier(0.16, 1, 0.3, 1)",
              }}
            />
          </svg>
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "grid",
              placeItems: "center",
              fontSize: 13,
              fontWeight: 700,
              fontFamily: "var(--sq-mono)",
              color: ringColor,
            }}
          >
            {pct}%
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span
              style={{
                fontWeight: 600,
                fontSize: 22,
                letterSpacing: "-0.02em",
                color: "var(--sq-ink)",
              }}
            >
              {value}
            </span>
            <span
              style={{
                fontSize: 11,
                fontWeight: 600,
                padding: "2px 8px",
                borderRadius: 9999,
                background: badgeBg,
                color: ringColor,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
            >
              {word} confidence
            </span>
          </div>
          <span style={{ fontSize: 13, color: "var(--sq-muted)" }}>
            Calibrated multimodal confidence & consistency check
          </span>
        </div>

        <div style={{ flex: 1 }} />
        <button type="button" className="sq-linkbtn" onClick={onToggle} style={{ fontSize: 13 }}>
          {open ? "Hide factors" : "How was this scored?"}
        </button>
      </div>

      {open && (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 14,
            paddingTop: 16,
            borderTop: "1px solid var(--sq-rule)",
          }}
        >
          {factors.map((f) => {
            const factorVal = parseFloat(f.value) || 0.8;
            const factorPct = Math.round(factorVal * 100);

            return (
              <div
                key={f.name}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 6,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: 12,
                    fontSize: 13,
                  }}
                >
                  <span style={{ color: "var(--sq-ink-soft)", fontWeight: 500 }}>{f.name}</span>
                  <span className="sq-mono" style={{ color: ringColor, fontWeight: 600 }}>
                    {f.value} ({factorPct}%)
                  </span>
                </div>

                {/* Micro progress bar */}
                <div
                  style={{
                    height: 4,
                    borderRadius: 9999,
                    background: "rgba(255, 255, 255, 0.06)",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      height: "100%",
                      width: `${factorPct}%`,
                      background: ringColor,
                      borderRadius: 9999,
                      transition: "width 0.6s ease",
                    }}
                  />
                </div>

                <span
                  style={{
                    fontSize: 12,
                    color: "var(--sq-faint)",
                    textWrap: "pretty",
                  }}
                >
                  {f.note}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
