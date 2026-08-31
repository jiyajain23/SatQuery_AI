import { VIOLET } from "@/data/mockData";

/**
 * The agentic execution trace: one dot per step, pulsing while active.
 * Used in the answer thread and by the run overlay.
 */
export function PipelineTrace({ steps, activeIndex, running }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {steps.map((label, i) => {
        const active = running && i === activeIndex;
        const pending = running && i > activeIndex;
        return (
          <div
            key={label}
            style={{
              display: "grid",
              gridTemplateColumns: "9px minmax(0,1fr)",
              gap: 12,
              alignItems: "baseline",
            }}
          >
            <span
              className={active ? "sq-pulse" : undefined}
              style={{
                width: 6,
                height: 6,
                borderRadius: 9999,
                background: pending
                  ? "var(--sq-rule)"
                  : active
                    ? VIOLET
                    : "var(--sq-faint)",
              }}
            />
            <span
              style={{
                fontSize: 14,
                letterSpacing: "0.14px",
                color: pending ? "var(--sq-faint)" : "var(--sq-ink-soft)",
                textWrap: "pretty",
              }}
            >
              {label}
            </span>
          </div>
        );
      })}
    </div>
  );
}
