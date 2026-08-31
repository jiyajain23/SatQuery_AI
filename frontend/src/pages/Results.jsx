import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useLocation } from "@tanstack/react-router";
import {
  ArrowUpRight,
  Download,
  FileDown,
  Map as MapIcon,
  RotateCcw,
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

  return (
    <div
      style={{
        height: "100dvh",
        minHeight: 640,
        background: "var(--sq-bg)",
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
          padding: "20px 40px",
          borderBottom: "1px solid var(--sq-rule)",
          whiteSpace: "nowrap",
        }}
      >
        <Link
          to="/"
          style={{ fontWeight: 500, fontSize: 16, textDecoration: "none" }}
        >
          SatQuery
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
                background: i === 3 ? "var(--sq-panel)" : "transparent",
                color: i === 3 ? "var(--sq-ink)" : "var(--sq-muted)",
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
        <Pill solid>
          <Download size={14} strokeWidth={1.7} aria-hidden="true" />
          Export
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
                      }}
                    >
                      {m.headline}
                    </div>
                    {m.body.map((p) => (
                      <p
                        key={p.slice(0, 24)}
                        style={{
                          fontSize: 16,
                          lineHeight: 1.5,
                          letterSpacing: "0.16px",
                          color: "var(--sq-muted)",
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
                      <Pill solid>
                        <FileDown size={14} strokeWidth={1.7} aria-hidden="true" />
                        Download PDF
                      </Pill>
                      <Pill>
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
