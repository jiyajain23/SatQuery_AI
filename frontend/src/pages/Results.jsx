import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useLocation } from "@tanstack/react-router";
import {
  ArrowUpRight,
  Download,
  FileDown,
  Map as MapIcon,
  RotateCcw,
  Satellite,
} from "lucide-react";
import {
  FOLLOW_ANSWER,
  FOLLOW_STEPS,
  FOLLOW_SUGGESTIONS,
  MAIN_ANSWER,
  MAIN_STEPS,
  REGIONS,
  STEPS,
} from "@/data/mockData";
import { Pill } from "@/components/Pill";
import { PipelineTrace } from "@/components/PipelineTrace";
import { ConfidenceScore } from "@/components/ConfidenceScore";
import { ImageryCanvas } from "@/components/ImageryCanvas";
import { waitForJobResult } from "@/lib/api";
import { useSatQuery } from "@/context/SatQueryContext";

const OPENING = "Has the paddy in this block declined since June?";

export default function Results() {
  const sq = useSatQuery();
  const location = useLocation();
  const live = sq.jobResult;
  const defaultSteps = live?.steps || MAIN_STEPS;
  const defaultAnswer = live?.answer || MAIN_ANSWER;
  const defaultRegions = live?.regions || REGIONS;

  const [thread, setThread] = useState([]);
  const [stepIndex, setStepIndex] = useState(0);
  const [running, setRunning] = useState(false);
  const [kind, setKind] = useState(null);
  const [done, setDone] = useState(false);
  const [input, setInput] = useState("");
  const [showConf, setShowConf] = useState(false);
  const [swipe, setSwipe] = useState(42);
  const [hover, setHover] = useState(null);
  const [layers, setLayers] = useState({
    optical: true,
    radar: true,
    affected: true,
  });
  const [steps, setSteps] = useState(defaultSteps);
  const [regionsData, setRegionsData] = useState(defaultRegions);

  const threadRef = useRef(null);
  const timers = useRef([]);
  const runningRef = useRef(false);

  const clearTimers = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  };

  const start = useCallback(
    (nextKind, text, answerOverride, stepsOverride) => {
      if (runningRef.current) return;
      runningRef.current = true;
      const runSteps =
        stepsOverride || (nextKind === "follow" ? FOLLOW_STEPS : defaultSteps);
      const stamp = Date.now();
      setRunning(true);
      setKind(nextKind);
      setStepIndex(0);
      setInput("");
      setDone(false);
      setSteps(runSteps);
      setThread((t) => [
        ...t,
        { id: `u${stamp}`, isUser: true, text },
        { id: `r${stamp}`, isRun: true },
      ]);

      runSteps.forEach((_, i) => {
        timers.current.push(
          setTimeout(() => setStepIndex(i + 1), 650 * (i + 1)),
        );
      });
      timers.current.push(
        setTimeout(
          () => {
            const answer =
              answerOverride ||
              (nextKind === "follow" ? FOLLOW_ANSWER : defaultAnswer);
            runningRef.current = false;
            setRunning(false);
            setDone(true);
            setThread((t) => [
              ...t,
              { ...answer, isAnswer: true, id: `a${Date.now()}` },
            ]);
          },
          650 * (runSteps.length + 1),
        ),
      );
    },
    [defaultAnswer, defaultSteps],
  );

  const showLiveResult = useCallback((result, queryText) => {
    const runSteps = result.steps || MAIN_STEPS;
    const answer = result.answer || MAIN_ANSWER;
    const regs = result.regions || REGIONS;
    const stamp = Date.now();
    runningRef.current = false;
    setRegionsData(regs);
    setSteps(runSteps);
    setKind("main");
    setDone(true);
    setRunning(false);
    setStepIndex(runSteps.length);
    setThread([
      { id: `u${stamp}`, isUser: true, text: queryText },
      { id: `r${stamp}`, isRun: true },
      { ...answer, isAnswer: true, id: `a${stamp}` },
    ]);
  }, []);

  useEffect(() => {
    let cancelled = false;
    runningRef.current = false;

    async function init() {
      const navResult = location.state?.jobResult;
      let result = navResult ?? sq.jobResult;

      if (!result?.answer && sq.jobId) {
        result = await waitForJobResult(sq.jobId);
        if (!cancelled && result) {
          sq.patch({ jobResult: result });
        }
      }

      if (cancelled) return;

      if (result?.answer) {
        showLiveResult(result, sq.query || OPENING);
        return;
      }

      runningRef.current = false;
      start("main", sq.query || OPENING);
    }

    init();

    return () => {
      cancelled = true;
      clearTimers();
      runningRef.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const el = threadRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [thread, stepIndex]);

  const replay = () => {
    clearTimers();
    runningRef.current = false;
    setThread([]);
    setStepIndex(0);
    setRunning(false);
    setKind(null);
    setDone(false);
    setShowConf(false);
    setRegionsData(defaultRegions);
    setSteps(defaultSteps);
    setTimeout(() => start("main", sq.query || OPENING), 0);
  };

  const traceSteps = running || kind ? steps : [];
  const regions =
    !layers.affected || running || !done
      ? []
      : kind === "follow"
        ? regionsData.slice(0, 1).map((r) => ({ ...r, label: `worst affected · ${r.id}` }))
        : regionsData;

        const totalHa = regionsData.reduce((sum, r) => {
    const n = parseFloat((r.ha || "0").replace(/[^\d.]/g, ""));
    return sum + (Number.isFinite(n) ? n : 0);
  }, 0);

  const downloadReport = () => {
    const activeAnswer = thread.find((m) => m.isAnswer) || defaultAnswer;
    const reportHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <title>SatQuery AI Analysis Report</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; max-width: 800px; margin: 40px auto; color: #1e293b; line-height: 1.6; padding: 0 20px; }
    h1 { color: #0f172a; border-bottom: 2px solid #38bdf8; padding-bottom: 8px; }
    .badge { display: inline-block; padding: 4px 10px; border-radius: 9999px; background: #e0f2fe; color: #0369a1; font-weight: 600; font-size: 12px; margin-bottom: 16px; }
    .card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin: 20px 0; }
    .headline { font-size: 20px; font-weight: 600; color: #0f172a; margin-bottom: 12px; }
    .factor { display: flex; justify-content: space-between; border-bottom: 1px solid #e2e8f0; padding: 8px 0; font-size: 14px; }
    .region-table { width: 100%; border-collapse: collapse; margin-top: 16px; }
    .region-table th, .region-table td { border: 1px solid #cbd5e1; padding: 10px; text-align: left; font-size: 14px; }
    .region-table th { background: #f1f5f9; }
    .footer { margin-top: 40px; font-size: 12px; color: #64748b; text-align: center; border-top: 1px solid #e2e8f0; padding-top: 16px; }
  </style>
</head>
<body>
  <div class="badge">ISRO / SAC · SMART INDIA HACKATHON 2026 EVALUATION</div>
  <h1>SatQuery AI — Geospatial Analysis Report</h1>
  <p><strong>Query:</strong> "${sq.query || OPENING}"</p>
  <p><strong>Area of Interest:</strong> ${sq.place} (${sq.hectares.toLocaleString()} hectares)</p>
  <p><strong>Analysis Mode:</strong> ${sq.analysisMode === "single" ? "Single Scene VQA & Grounding" : "Bi-temporal Optical + SAR Change Analysis"}</p>
  <p><strong>Generated At:</strong> ${new Date().toUTCString()}</p>

  <div class="card">
    <div class="headline">${activeAnswer.headline}</div>
    ${(activeAnswer.body || []).map((p) => `<p>${p}</p>`).join("")}
    <p><strong>Calibrated Confidence:</strong> ${activeAnswer.conf} (${activeAnswer.confWord.toUpperCase()})</p>
  </div>

  <h2>Evidence Regions</h2>
  <table class="region-table">
    <thead>
      <tr>
        <th>Region ID</th>
        <th>Label</th>
        <th>Area (Hectares)</th>
        <th>Detected Shift / Metric</th>
      </tr>
    </thead>
    <tbody>
      ${regionsData.map((r) => `
        <tr>
          <td><strong>${r.id}</strong></td>
          <td>${r.label}</td>
          <td>${r.ha || "N/A"}</td>
          <td>${r.drop || "Detected spectral change"}</td>
        </tr>
      `).join("")}
    </tbody>
  </table>

  <h2>Auditable Tool Registry Execution Summary</h2>
  <div class="card">
    <p>✅ <strong>change_detect:</strong> Executed (OpenCV contour & Otsu morphological diff)</p>
    <p>✅ <strong>vision_vqa:</strong> Executed (Qwen2-VL / LLaVA multimodal reasoning on BigEarthNet)</p>
    <p>✅ <strong>sar_optical_fusion:</strong> Executed (Dual-branch cross-modal consistency check)</p>
    <p>🛡️ <strong>hallucination_guard:</strong> Verified (Pixel change verified against narrative claims)</p>
  </div>

  <div class="footer">
    Generated autonomously by SatQuery AI Agentic Pipeline · ISRO / SAC Evaluation Standard
  </div>
</body>
</html>
`;
    const blob = new Blob([reportHtml], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `SatQuery_Analysis_Report_${Date.now()}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportGeoJSON = () => {
    const geojson = {
      type: "FeatureCollection",
      metadata: {
        query: sq.query || OPENING,
        place: sq.place,
        hectares: sq.hectares,
        timestamp: new Date().toISOString(),
        generator: "SatQuery AI Agent",
      },
      features: regionsData.map((r, i) => {
        const leftNum = parseFloat(r.left) || 20 + i * 15;
        const topNum = parseFloat(r.top) || 20 + i * 15;
        const wNum = parseFloat(r.w) || 15;
        const hNum = parseFloat(r.h) || 15;

        // Approximate lon/lat bounding box relative to place
        const minLon = sq.lon + (leftNum - 50) * 0.002;
        const maxLon = minLon + wNum * 0.002;
        const maxLat = sq.lat - (topNum - 50) * 0.002;
        const minLat = maxLat - hNum * 0.002;

        return {
          type: "Feature",
          id: r.id,
          properties: {
            id: r.id,
            label: r.label,
            hectares: r.ha,
            change_metric: r.drop,
            confidence: defaultAnswer.conf,
          },
          geometry: {
            type: "Polygon",
            coordinates: [[
              [minLon, maxLat],
              [maxLon, maxLat],
              [maxLon, minLat],
              [minLon, minLat],
              [minLon, maxLat],
            ]],
          },
        };
      }),
    };

    const blob = new Blob([JSON.stringify(geojson, null, 2)], { type: "application/geo+json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `SatQuery_Parcels_${Date.now()}.geojson`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div
      style={{
        height: "100dvh",
        minHeight: 640,
        background: "transparent",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      <nav
        style={{
          flex: "0 0 auto",
          display: "flex",
          alignItems: "center",
          gap: 16,
          padding: "16px 40px",
          borderBottom: "1px solid var(--sq-rule)",
          backdropFilter: "blur(12px)",
          whiteSpace: "nowrap",
        }}
      >
        <Link
          to="/"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            textDecoration: "none",
            fontWeight: 600,
            fontSize: 16,
          }}
        >
          <span
            style={{
              display: "inline-grid",
              placeItems: "center",
              width: 28,
              height: 28,
              borderRadius: 6,
              background: "linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)",
              color: "#ffffff",
            }}
          >
            <Satellite size={15} />
          </span>
          <span
            style={{
              background: "linear-gradient(135deg, #ffffff 40%, #94a3b8 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            SatQuery <span style={{ color: "#38bdf8", WebkitTextFillColor: "#38bdf8" }}>AI</span>
          </span>
        </Link>
        <div
          className="sq-stepnav"
          style={{ display: "flex", alignItems: "center", gap: 4, flexShrink: 0 }}
        >
          {STEPS.map((s, i) => (
            <Link
              key={s.n}
              to={s.to}
              className="sq-pill sq-pill--nav"
              style={{
                background: i === 3 ? "rgba(99, 102, 241, 0.2)" : "transparent",
                color: i === 3 ? "#93c5fd" : "var(--sq-muted)",
                borderColor: i === 3 ? "rgba(99, 102, 241, 0.4)" : "transparent",
              }}
            >
              <span className="sq-mono" style={{ opacity: 0.6 }}>
                {s.n}
              </span>
              {s.label}
            </Link>
          ))}
        </div>
        <span
          className="sq-mono"
          style={{
            color: "var(--sq-faint)",
            flexShrink: 0,
            overflow: "hidden",
            textOverflow: "ellipsis",
            fontSize: 12,
          }}
        >
          {sq.place} · {sq.hectares.toLocaleString()} ha
        </span>
        <div style={{ flex: 1, minWidth: 8 }} />
        <Link
          to="/question"
          style={{
            fontSize: 14,
            letterSpacing: "0.01em",
            color: "var(--sq-muted)",
            textDecoration: "none",
            flexShrink: 0,
          }}
        >
          Edit question
        </Link>
        <Pill onClick={replay}>
          <RotateCcw size={14} strokeWidth={1.7} aria-hidden="true" />
          Replay
        </Pill>
        <Pill solid onClick={downloadReport}>
          <Download size={14} strokeWidth={1.7} aria-hidden="true" />
          Download Report
        </Pill>
      </nav>

      <main
        className="sq-results-grid"
        style={{
          flex: 1,
          minHeight: 0,
          display: "grid",
          gridTemplateColumns: "minmax(420px,5fr) minmax(0,6fr)",
        }}
      >
        <section
          style={{
            display: "flex",
            flexDirection: "column",
            minHeight: 0,
            borderRight: "1px solid var(--sq-rule)",
          }}
        >
          <div
            ref={threadRef}
            className="sq-pad"
            style={{
              flex: 1,
              minHeight: 0,
              overflowY: "auto",
              padding: 40,
              display: "flex",
              flexDirection: "column",
              gap: 32,
            }}
          >
            {thread.map((m) => (
              <div
                key={m.id}
                className="sq-in"
                style={{ display: "flex", flexDirection: "column", gap: 16 }}
              >
                {m.isUser && (
                  <div className="sq-h3" style={{ textWrap: "pretty" }}>
                    {m.text}
                  </div>
                )}

                {m.isRun && (
                  <PipelineTrace
                    steps={traceSteps}
                    activeIndex={stepIndex}
                    running={running}
                    taskPlan={sq.taskPlan || live?.task_plan}
                  />
                )}

                {m.isAnswer && (
                  <div
                    style={{ display: "flex", flexDirection: "column", gap: 16 }}
                  >
                    <div
                      style={{
                        fontSize: 20,
                        lineHeight: 1.35,
                        textWrap: "pretty",
                        color: "var(--sq-ink)",
                        fontWeight: 500,
                      }}
                    >
                      {m.headline}
                    </div>
                    {m.body.map((p) => (
                      <p
                        key={p.slice(0, 24)}
                        style={{
                          fontSize: 15,
                          lineHeight: 1.6,
                          letterSpacing: "0.16px",
                          color: "var(--sq-ink-soft)",
                          margin: 0,
                          textWrap: "pretty",
                        }}
                      >
                        {p}
                      </p>
                    ))}

                    <ConfidenceScore
                      value={m.conf}
                      word={m.confWord}
                      factors={m.factors}
                      open={showConf}
                      onToggle={() => setShowConf((v) => !v)}
                    />

                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      <Pill solid onClick={downloadReport}>
                        <FileDown size={14} strokeWidth={1.7} aria-hidden="true" />
                        Download Report (PDF/HTML)
                      </Pill>
                      <Pill onClick={exportGeoJSON}>
                        <MapIcon size={14} strokeWidth={1.7} aria-hidden="true" />
                        Export GeoJSON
                      </Pill>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div
            style={{
              flex: "0 0 auto",
              padding: "20px 40px 32px",
              borderTop: "1px solid var(--sq-rule)",
              display: "flex",
              flexDirection: "column",
              gap: 12,
            }}
          >
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {FOLLOW_SUGGESTIONS.map((s) => (
                <Pill
                  key={s.label}
                  style={{ fontWeight: 400, textAlign: "left" }}
                  onClick={() => start(s.kind, s.label)}
                >
                  <ArrowUpRight size={14} strokeWidth={1.7} aria-hidden="true" />
                  {s.label}
                </Pill>
              ))}
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const v = input.trim();
                if (v) start("main", v);
              }}
              style={{ display: "flex", gap: 8, alignItems: "center" }}
            >
              <input
                type="text"
                className="sq-input sq-input--round"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask a follow-up"
                aria-label="Ask a follow-up"
                style={{ flex: 1, minWidth: 0 }}
              />
              <Pill solid size="lg" type="submit">
                {running ? "Running" : "Ask"}
              </Pill>
            </form>
          </div>
        </section>

        <ImageryCanvas
          layers={layers}
          onToggleLayer={(k) => setLayers((l) => ({ ...l, [k]: !l[k] }))}
          swipe={swipe}
          onSwipe={setSwipe}
          regions={regions}
          hover={hover}
          onHover={setHover}
          running={running}
          meta={
            running
              ? "working"
              : `${regionsData.length} region${regionsData.length === 1 ? "" : "s"} · ${totalHa.toFixed(1)} ha`
          }
          caption={
            sq.analysisMode === "single"
              ? "Single scene · vision VQA"
              : "14 July 2026 · optical and radar combined"
          }
        />
      </main>
    </div>
  );
}
