import { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { AlertTriangle, Plus, Satellite, Upload } from "lucide-react";
import {
  BAD_SCENE,
  FAILURE_TITLE,
} from "@/data/mockData";
import {
  DEMO_SCENES,
  loadBadDemoFile,
  loadDemoFiles,
  validateImages,
} from "@/lib/api";
import { TopNav } from "@/components/TopNav";
import { SceneRow } from "@/components/SceneRow";
import { Pill, PillLink } from "@/components/Pill";
import { useSatQuery } from "@/context/SatQueryContext";

function sceneRowsForMode(mode) {
  if (mode === "single") {
    return DEMO_SCENES.single.map((s) => ({
      id: s.id,
      plain: s.plain,
      file: s.file,
    }));
  }
  return DEMO_SCENES.bitemporal.map((s) => ({
    id: s.id,
    plain: s.plain,
    file: s.file,
  }));
}

export default function Imagery() {
  const sq = useSatQuery();
  const [scenes, setScenes] = useState(() => sceneRowsForMode(sq.analysisMode));
  const [phase, setPhase] = useState("checking");
  const [bad, setBad] = useState(false);
  const [details, setDetails] = useState(false);
  const [open, setOpen] = useState(null);
  const [checks, setChecks] = useState([]);
  const [failureReasons, setFailureReasons] = useState([]);
  const [failureTitle, setFailureTitle] = useState(FAILURE_TITLE);
  const fileRef = useRef(null);
  const mounted = useRef(true);

  const runValidation = async (files, acquiredDates, includeBad = false) => {
    setPhase("checking");
    sq.patch({ scenesReady: false, validation: null });
    try {
      let allFiles = [...files];
      if (includeBad) {
        allFiles = [...files, await loadBadDemoFile()];
      }
      const result = await validateImages(allFiles, acquiredDates);
      if (!mounted.current) return;
      setChecks(result.checks);
      setFailureReasons(result.failure_reasons || []);
      setFailureTitle(result.failure_title || FAILURE_TITLE);
      setBad(includeBad || !result.passed);
      setPhase("done");
      sq.patch({
        imageFiles: files,
        validation: result,
        scenesReady: result.passed,
        analysisMode: files.length >= 2 ? "bitemporal" : "single",
      });
    } catch {
      if (!mounted.current) return;
      setPhase("done");
      setBad(true);
      setChecks([]);
      setFailureReasons(["Could not reach the analysis backend. Start the API server on port 8000."]);
      sq.patch({ scenesReady: false, validation: null });
    }
  };

  const loadDemo = async (mode) => {
    const files = await loadDemoFiles(mode);
    const meta = mode === "bitemporal" ? DEMO_SCENES.bitemporal : DEMO_SCENES.single;
    setScenes(sceneRowsForMode(mode));
    sq.patch({ analysisMode: mode, sceneMeta: meta });
    await runValidation(files, meta.map((m) => m.acquiredAt));
  };

  useEffect(() => {
    mounted.current = true;
    loadDemo(sq.analysisMode || "bitemporal");
    return () => {
      mounted.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const checking = phase === "checking";
  const blocked = checking || bad || !sq.scenesReady;
  const tone = (ok) =>
    checking ? "var(--sq-faint)" : ok ? "var(--sq-ink-soft)" : "var(--sq-orange)";

  const addBad = async () => {
    if (bad || !sq.imageFiles?.length) return;
    setScenes((s) => [...s, { ...BAD_SCENE, ...DEMO_SCENES.bad, plain: DEMO_SCENES.bad.plain, file: DEMO_SCENES.bad.file }]);
    const dates = (sq.sceneMeta || DEMO_SCENES.bitemporal).map((m) => m.acquiredAt);
    await runValidation(sq.imageFiles, dates, true);
  };

  const clearBad = async () => {
    setScenes(sceneRowsForMode(sq.analysisMode));
    const meta = sq.sceneMeta?.length
      ? sq.sceneMeta
      : sq.analysisMode === "single"
        ? DEMO_SCENES.single
        : DEMO_SCENES.bitemporal;
    await runValidation(sq.imageFiles, meta.map((m) => m.acquiredAt));
  };

  const onUpload = async (e) => {
    const picked = Array.from(e.target.files || []);
    if (!picked.length) return;
    const mode = picked.length >= 2 ? "bitemporal" : "single";
    setScenes(
      picked.map((f, i) => ({
        id: `u${i}`,
        plain: f.name,
        file: `${(f.size / 1024 / 1024).toFixed(1)} MB · uploaded`,
      })),
    );
    sq.patch({ imagerySource: "upload", analysisMode: mode });
    await runValidation(picked);
    e.target.value = "";
  };

  const readyCount = scenes.filter((s) => s.id !== "x").length;

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--sq-bg)",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <TopNav current={1} reachable={blocked ? 1 : 2} />

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
        <div>
          <h1 className="sq-h2" style={{ marginBottom: 12 }}>
            Imagery for this area
          </h1>
          <p
            style={{
              fontSize: 16,
              letterSpacing: "0.16px",
              color: "var(--sq-muted)",
              margin: 0,
              maxWidth: "58ch",
            }}
          >
            Every scene is checked before anything is analysed. Scenes that fail
            are excluded, with the reason shown.
          </p>
        </div>

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {[
            { key: "auto", title: "Use free public imagery", Icon: Satellite },
            { key: "upload", title: "Upload my own files", Icon: Upload },
          ].map((s) => (
            <Pill
              key={s.key}
              selected={sq.imagerySource === s.key}
              onClick={() => {
                sq.patch({ imagerySource: s.key });
                if (s.key === "upload") fileRef.current?.click();
                else loadDemo(sq.analysisMode || "bitemporal");
              }}
            >
              <s.Icon size={14} strokeWidth={1.6} aria-hidden="true" />
              {s.title}
            </Pill>
          ))}
          <Pill
            selected={sq.analysisMode === "single"}
            onClick={() => loadDemo("single")}
          >
            Single-image demo
          </Pill>
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/tiff,.tif,.tiff"
            multiple
            hidden
            onChange={onUpload}
          />
        </div>

        <div
          className="sq-panel"
          style={{ display: "flex", flexDirection: "column", padding: "8px 32px" }}
        >
          {scenes.map((s, i) => (
            <SceneRow
              key={s.id}
              scene={s}
              first={i === 0}
              expanded={open === s.id}
              state={checking ? "checking" : s.id === "x" ? "excluded" : "ready"}
              onToggle={() => setOpen((p) => (p === s.id ? null : s.id))}
            />
          ))}
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            flexWrap: "wrap",
          }}
        >
          <span
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              fontSize: 16,
              letterSpacing: "0.16px",
              color: checking ? "var(--sq-muted)" : "var(--sq-ink)",
            }}
          >
            <span
              className={checking ? "sq-pulse" : undefined}
              style={{
                width: 7,
                height: 7,
                borderRadius: 9999,
                background: checking
                  ? "var(--sq-faint)"
                  : bad
                    ? "var(--sq-orange)"
                    : "var(--sq-violet)",
              }}
            />
            {checking
              ? "Checking scenes…"
              : bad
                ? `${readyCount} scenes ready, 1 excluded`
                : `${readyCount} scene${readyCount === 1 ? "" : "s"} ready`}
          </span>
          <button
            type="button"
            className="sq-linkbtn"
            onClick={() => setDetails((d) => !d)}
          >
            {details ? "Hide checks" : `Show the ${checks.length || 6} checks`}
          </button>
          <div style={{ flex: 1 }} />
          {sq.analysisMode === "bitemporal" && (
            <Pill onClick={addBad}>
              <Plus size={14} strokeWidth={1.8} aria-hidden="true" />
              Add a scene of my own
            </Pill>
          )}
        </div>

        {details && checks.length > 0 && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              borderTop: "1px solid var(--sq-rule)",
            }}
          >
            {checks.map((c) => (
              <div
                key={c.label}
                style={{
                  display: "grid",
                  gridTemplateColumns: "minmax(0,1fr) auto",
                  gap: 20,
                  alignItems: "baseline",
                  padding: "14px 0",
                  borderBottom: "1px solid var(--sq-rule)",
                }}
              >
                <span
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 2,
                    minWidth: 0,
                  }}
                >
                  <span style={{ fontSize: 16, letterSpacing: "0.16px" }}>
                    {c.label}
                  </span>
                  <span
                    style={{
                      fontSize: 14,
                      letterSpacing: "0.14px",
                      color: "var(--sq-faint)",
                      textWrap: "pretty",
                    }}
                  >
                    {c.plain}
                  </span>
                </span>
                <span className="sq-mono" style={{ color: tone(c.ok) }}>
                  {c.value}
                </span>
              </div>
            ))}
          </div>
        )}

        {bad && !checking && (
          <div
            className="sq-panel"
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 16,
              padding: 32,
            }}
          >
            <span
              style={{
                display: "flex",
                gap: 12,
                alignItems: "flex-start",
                fontSize: 20,
                lineHeight: 1.35,
                textWrap: "pretty",
              }}
            >
              <AlertTriangle
                size={20}
                strokeWidth={1.6}
                aria-hidden="true"
                style={{ flexShrink: 0, marginTop: 4, color: "var(--sq-orange)" }}
              />
              {failureTitle}
            </span>
            {failureReasons.map((r) => (
              <span
                key={r}
                style={{
                  fontSize: 14,
                  lineHeight: 1.5,
                  letterSpacing: "0.14px",
                  color: "var(--sq-muted)",
                  textWrap: "pretty",
                  paddingTop: 12,
                  borderTop: "1px solid var(--sq-rule)",
                }}
              >
                {r}
              </span>
            ))}
            <div style={{ display: "flex", gap: 8, paddingTop: 4, flexWrap: "wrap" }}>
              <Pill onClick={clearBad}>Remove scene</Pill>
            </div>
          </div>
        )}

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            paddingTop: 24,
            borderTop: "1px solid var(--sq-rule)",
          }}
        >
          <PillLink to="/question" solid size="lg" disabled={blocked}>
            Continue
          </PillLink>
          <Link
            to="/area"
            style={{
              fontSize: 14,
              letterSpacing: "0.01em",
              color: "var(--sq-muted)",
            }}
          >
            Back
          </Link>
        </div>
      </main>
    </div>
  );
}
