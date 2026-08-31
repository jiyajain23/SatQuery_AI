import { useEffect, useState } from "react";
import { PIPELINE_STAGES } from "@/data/mockData";
import { subscribeToJob, waitForJobResult } from "@/lib/api";
import { Satellite, Radio } from "lucide-react";

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
        zIndex: 50,
        background: "rgba(7, 9, 14, 0.88)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        display: "grid",
        placeItems: "center",
        padding: 32,
      }}
    >
      <div
        style={{
          width: "min(680px, 100%)",
          display: "flex",
          flexDirection: "column",
          gap: 24,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span
            style={{
              display: "inline-grid",
              placeItems: "center",
              width: 36,
              height: 36,
              borderRadius: 10,
              background: "linear-gradient(135deg, #00f0ff 0%, #6366f1 100%)",
              color: "#ffffff",
              boxShadow: "0 0 20px rgba(0, 240, 255, 0.4)",
            }}
          >
            <Radio size={18} className="sq-pulse" />
          </span>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span className="sq-mono" style={{ color: "#38bdf8", fontSize: 11, fontWeight: 600 }}>
              AGENTIC PIPELINE EXECUTION IN PROGRESS
            </span>
            <span className="sq-h3" style={{ fontSize: 20, color: "var(--sq-ink)", fontWeight: 500 }}>
              "{query}"
            </span>
          </div>
        </div>

        <div
          className="sq-panel sq-glow-border"
          style={{
            padding: 32,
            display: "flex",
            flexDirection: "column",
            gap: 14,
            borderRadius: 20,
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
                  gridTemplateColumns: "20px minmax(0,1fr) auto",
                  gap: 12,
                  alignItems: "center",
                }}
              >
                <span
                  style={{
                    fontSize: 14,
                    color: done ? "#34d399" : active ? "#38bdf8" : "var(--sq-faint)",
                    fontWeight: 700,
                  }}
                >
                  {done ? "✓" : active ? "◉" : "○"}
                </span>
                <span
                  style={{
                    fontSize: 15,
                    letterSpacing: "0.14px",
                    color: done ? "var(--sq-ink-soft)" : active ? "#ffffff" : "var(--sq-faint)",
                    fontWeight: active ? 600 : 400,
                  }}
                >
                  {label}
                  {active ? "…" : ""}
                </span>
                <span
                  className="sq-mono"
                  style={{
                    fontSize: 11,
                    color: active ? "#38bdf8" : "var(--sq-faint)",
                    background: active ? "rgba(56, 189, 248, 0.1)" : "transparent",
                    padding: "2px 8px",
                    borderRadius: 4,
                  }}
                >
                  {stages[i]}
                </span>
              </div>
            );
          })}
        </div>

        <div
          style={{
            height: 4,
            borderRadius: 9999,
            background: "rgba(255, 255, 255, 0.08)",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              height: "100%",
              width: `${(index / PIPELINE_STAGES.length) * 100}%`,
              background: "linear-gradient(90deg, #38bdf8, #6366f1)",
              boxShadow: "0 0 12px rgba(56, 189, 248, 0.6)",
              transition: "width 0.4s ease",
            }}
          />
        </div>
      </div>
    </div>
  );
}
