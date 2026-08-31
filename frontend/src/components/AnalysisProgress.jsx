import { useEffect, useState } from "react";
import { PIPELINE_STAGES, VIOLET } from "@/data/mockData";
import { subscribeToJob, waitForJobResult } from "@/lib/api";

/**
 * Live agentic run driven by backend SSE. Falls back to timed mock stages if SSE fails.
 */
export function AnalysisProgress({ query, jobId, onDone, onError }) {
  const [index, setIndex] = useState(0);
  const [labels, setLabels] = useState(PIPELINE_STAGES.map((s) => s.label));
  const [stages, setStages] = useState(PIPELINE_STAGES.map((s) => s.stage));

  useEffect(() => {
    if (!jobId) {
      const timers = PIPELINE_STAGES.map((_, i) =>
        setTimeout(() => setIndex(i + 1), 480 * (i + 1)),
      );
      timers.push(setTimeout(onDone, 480 * (PIPELINE_STAGES.length + 1)));
      return () => timers.forEach(clearTimeout);
    }

    let highest = 0;
    const unsub = subscribeToJob(
      jobId,
      (event) => {
        const idx = event.index + 1;
        highest = Math.max(highest, idx);
        setIndex(highest);
        setLabels((prev) => {
          const next = [...prev];
          next[event.index] = event.label;
          return next;
        });
        setStages((prev) => {
          const next = [...prev];
          next[event.index] = event.stage;
          return next;
        });
      },
      async () => {
        setIndex(PIPELINE_STAGES.length);
        try {
          const result = await waitForJobResult(jobId);
          onDone(result);
        } catch (e) {
          onError?.(e);
          onDone(null);
        }
      },
      (err) => {
        onError?.(err);
        onDone(null);
      },
    );

    return unsub;
  }, [jobId, onDone, onError]);

  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 20,
        background: "rgba(253,252,252,0.94)",
        display: "grid",
        placeItems: "center",
        padding: 32,
      }}
    >
      <div
        style={{
          width: "min(640px, 100%)",
          display: "flex",
          flexDirection: "column",
          gap: 24,
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <span className="sq-mono" style={{ color: "var(--sq-faint)" }}>
            running
          </span>
          <span className="sq-h3" style={{ textWrap: "pretty" }}>
            {query}
          </span>
        </div>

        <div
          className="sq-panel"
          style={{
            padding: 32,
            display: "flex",
            flexDirection: "column",
            gap: 12,
          }}
        >
          {labels.map((label, i) => {
            const done = i < index;
            const active = i === index;
            return (
              <div
                key={`${label}-${i}`}
                style={{
                  display: "grid",
                  gridTemplateColumns: "16px minmax(0,1fr) auto",
                  gap: 12,
                  alignItems: "baseline",
                }}
              >
                <span
                  className={active ? "sq-pulse sq-mono" : "sq-mono"}
                  style={{
                    color: done
                      ? VIOLET
                      : active
                        ? VIOLET
                        : "var(--sq-disabled)",
                  }}
                >
                  {done ? "✓" : active ? "◉" : "○"}
                </span>
                <span
                  style={{
                    fontSize: 16,
                    letterSpacing: "0.16px",
                    color: done || active ? "var(--sq-ink)" : "var(--sq-faint)",
                  }}
                >
                  {label}
                  {active ? "…" : ""}
                </span>
                <span className="sq-mono" style={{ color: "var(--sq-faint)" }}>
                  {stages[i]}
                </span>
              </div>
            );
          })}
        </div>

        <div
          style={{
            height: 2,
            borderRadius: 9999,
            background: "var(--sq-rule)",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              height: "100%",
              width: `${(index / PIPELINE_STAGES.length) * 100}%`,
              background: "var(--sq-ink)",
              transition: "width 0.4s ease",
            }}
          />
        </div>
      </div>
    </div>
  );
}
