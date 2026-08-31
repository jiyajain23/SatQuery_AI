import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { PROMPTS, interpretTokens } from "@/data/mockData";
import { previewPlan, startAnalysis } from "@/lib/api";
import { TopNav } from "@/components/TopNav";
import { Pill } from "@/components/Pill";
import { AnalysisProgress } from "@/components/AnalysisProgress";
import { useSatQuery } from "@/context/SatQueryContext";

export default function Question() {
  const sq = useSatQuery();
  const navigate = useNavigate();
  const [running, setRunning] = useState(false);
  const [jobId, setJobId] = useState(null);
  const [tokens, setTokens] = useState([]);
  const [interpretation, setInterpretation] = useState("Waiting for a question.");
  const [reasoning, setReasoning] = useState("");

  const q = sq.query.trim();
  const ready = q.length > 8 && sq.imageFiles?.length > 0;
  const imageCount = sq.imageFiles?.length || 0;

  useEffect(() => {
    if (!ready) {
      setTokens([]);
      setInterpretation("Waiting for a question.");
      setReasoning("");
      return;
    }
    let cancelled = false;
    previewPlan(q, imageCount, sq.goal)
      .then((plan) => {
        if (cancelled) return;
        setTokens(plan.tokens);
        setInterpretation(plan.interpretation || plan.task_plan?.interpretation || "");
        setReasoning(plan.reasoning || "");
        if (plan.task_plan) sq.patch({ taskPlan: plan.task_plan });
      })
      .catch(() => {
        if (cancelled) return;
        const fallbackTokens = interpretTokens(q);
        setTokens(fallbackTokens);
        setInterpretation(
          imageCount >= 2
            ? "Compare July against the June baseline, across both sensors, and report the decline by parcel."
            : "Describe land use and notable features in the uploaded scene.",
        );
        setReasoning(
          "Radar carries the comparison where cloud blocks the optical scene. The two readings are checked against each other; disagreement lowers the confidence rather than being hidden.",
        );
      });
    return () => {
      cancelled = true;
    };
  }, [q, imageCount, sq.goal, ready, sq]);

  const finish = useCallback(
    (result) => {
      if (result?.answer) {
        sq.patch({ jobResult: result });
      }
      navigate({
        to: "/results",
        state: result?.answer ? { jobResult: result } : undefined,
      });
    },
    [navigate, sq],
  );

  const run = async () => {
    if (!ready || running) return;
    setRunning(true);
    try {
      const { job_id } = await startAnalysis(
        q,
        sq.imageFiles,
        sq.goal,
        sq.hectares,
      );
      setJobId(job_id);
      sq.patch({ jobId: job_id });
    } catch {
      // Backend offline → run the mock pipeline animation (no jobId)
      setJobId(null);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "transparent",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <TopNav current={2} reachable={ready ? 3 : 2} />

      <main
        className="sq-pad"
        style={{
          maxWidth: 900,
          width: "100%",
          margin: "0 auto",
          padding: 64,
          display: "flex",
          flexDirection: "column",
          gap: 40,
          flex: 1,
        }}
      >
        <h1 className="sq-h2">What do you want to know?</h1>

        <textarea
          value={sq.query}
          onChange={(e) => sq.patch({ query: e.target.value })}
          placeholder="Write it as you would to a colleague (e.g. Has the paddy in this block declined since June?)"
          aria-label="Your question"
          style={{
            fontFamily: "inherit",
            fontSize: 20,
            lineHeight: 1.4,
            color: "var(--sq-ink)",
            background: "rgba(15, 23, 42, 0.65)",
            border: "1px solid var(--sq-rule-strong)",
            borderRadius: 20,
            padding: 24,
            minHeight: 120,
            resize: "vertical",
            backdropFilter: "blur(12px)",
            boxShadow: "0 4px 24px rgba(0, 0, 0, 0.3)",
          }}
        />

        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {PROMPTS.map((p) => (
            <Pill
              key={p}
              selected={p === sq.query}
              onClick={() => sq.patch({ query: p })}
              style={{ fontWeight: 400, textAlign: "left" }}
            >
              {p}
            </Pill>
          ))}
        </div>

        <div
          className="sq-panel sq-glow-border"
          style={{
            padding: 32,
            display: "flex",
            flexDirection: "column",
            gap: 12,
          }}
        >
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {tokens.map((t) => (
              <span
                key={t}
                className="sq-mono"
                style={{
                  color: "#38bdf8",
                  background: "rgba(56, 189, 248, 0.12)",
                  border: "1px solid rgba(56, 189, 248, 0.3)",
                  padding: "3px 12px",
                  borderRadius: 9999,
                  fontSize: 12,
                }}
              >
                {t}
              </span>
            ))}
          </div>
          <span className="sq-mono" style={{ color: "var(--sq-faint)", fontSize: 11 }}>
            Agent Interpretation Plan
          </span>
          <span style={{ fontSize: 19, lineHeight: 1.35, textWrap: "pretty", color: "var(--sq-ink)", fontWeight: 500 }}>
            {ready ? interpretation : "Waiting for a question."}
          </span>
          <span
            style={{
              fontSize: 14,
              lineHeight: 1.5,
              letterSpacing: "0.14px",
              color: "var(--sq-muted)",
              textWrap: "pretty",
            }}
          >
            {ready
              ? reasoning ||
                "Radar carries the comparison where cloud blocks the optical scene. The two readings are checked against each other; disagreement lowers the confidence rather than being hidden."
              : ""}
          </span>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            paddingTop: 24,
            borderTop: "1px solid var(--sq-rule)",
          }}
        >
          <Pill
            solid
            size="lg"
            disabled={!ready || running}
            onClick={run}
            style={!ready || running ? { opacity: 0.4, pointerEvents: "none" } : undefined}
          >
            Run analysis
          </Pill>
          <Link
            to="/imagery"
            style={{
              fontSize: 14,
              letterSpacing: "0.01em",
              color: "var(--sq-muted)",
            }}
          >
            Back
          </Link>
          <div style={{ flex: 1 }} />
          <span className="sq-mono" style={{ color: "var(--sq-faint)" }}>
            {imageCount >= 2 ? "bi-temporal" : "single-image"} · live pipeline
          </span>
        </div>
      </main>

      {running && (
        <AnalysisProgress
          query={sq.query}
          jobId={jobId}
          onDone={finish}
          onError={() => {}}
        />
      )}
    </div>
  );
}
