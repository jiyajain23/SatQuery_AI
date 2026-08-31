import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { DEMOS, HOME_STEPS } from "@/data/mockData";
import { PillLink } from "@/components/Pill";
import { useSatQuery } from "@/context/SatQueryContext";

const INITIAL = {
  demo: 0,
  chars: 0,
  phase: "typing",
  sweep: -20,
  revealed: 0,
  hold: 0,
};

export default function Home() {
  const [s, setS] = useState(INITIAL);
  const { patch } = useSatQuery();
  const tick = useRef(null);

  useEffect(() => {
    tick.current = setInterval(() => {
      setS((st) => {
        const d = DEMOS[st.demo];
        if (st.phase === "typing") {
          if (st.chars < d.q.length)
            return {
              ...st,
              chars: st.chars + 2 > d.q.length ? d.q.length : st.chars + 2,
            };
          return { ...st, phase: "scanning", sweep: -20 };
        }
        if (st.phase === "scanning") {
          if (st.sweep < 100) return { ...st, sweep: st.sweep + 6 };
          return { ...st, phase: "result", revealed: 0, hold: 0 };
        }
        if (st.revealed < d.boxes.length)
          return { ...st, revealed: st.revealed + 1 };
        if (st.hold < 70) return { ...st, hold: st.hold + 1 };
        return { ...INITIAL, demo: (st.demo + 1) % DEMOS.length };
      });
    }, 40);
    return () => clearInterval(tick.current);
  }, []);

  const play = useCallback(
    (i) => {
      setS({ ...INITIAL, demo: i });
      patch({ query: DEMOS[i].q });
    },
    [patch],
  );

  const d = DEMOS[s.demo];
  const scanning = s.phase === "scanning";
  const result = s.phase === "result";
  const phaseText =
    s.phase === "typing"
      ? "asking"
      : scanning
        ? "reading optical and radar"
        : d.result;

  return (
    <div style={{ minHeight: "100vh", background: "var(--sq-bg)" }}>
      <nav
        className="sq-pad"
        style={{
          maxWidth: 1280,
          margin: "0 auto",
          padding: "20px 64px",
          display: "flex",
          alignItems: "center",
          gap: 32,
        }}
      >
        <span style={{ fontWeight: 500, fontSize: 16 }}>SatQuery</span>
        <div style={{ flex: 1 }} />
        <Link
          to="/area"
          style={{
            fontSize: 14,
            letterSpacing: "0.01em",
            textDecoration: "none",
            color: "var(--sq-muted)",
          }}
        >
          How it works
        </Link>
        <Link
          to="/results"
          style={{
            fontSize: 14,
            letterSpacing: "0.01em",
            textDecoration: "none",
            color: "var(--sq-muted)",
          }}
        >
          Sample result
        </Link>
        <PillLink to="/area" solid>
          Start
        </PillLink>
      </nav>

      <header
        className="sq-pad sq-home-hero"
        style={{
          maxWidth: 1280,
          margin: "0 auto",
          padding: "96px 64px",
          display: "grid",
          gridTemplateColumns: "minmax(0,7fr) minmax(0,5fr)",
          gap: 64,
          alignItems: "start",
        }}
      >
        <div>
          <h1 className="sq-h1" style={{ marginBottom: 24 }}>
            Ask a plain question about a place.
          </h1>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <PillLink to="/area" solid size="lg">
              Start an analysis
            </PillLink>
            <PillLink to="/results" size="lg">
              See a finished answer
            </PillLink>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <p
            style={{
              fontSize: 16,
              lineHeight: 1.5,
              letterSpacing: "0.16px",
              color: "var(--sq-muted)",
              margin: 0,
            }}
          >
            SatQuery selects the imagery, runs the analysis, and returns an
            answer with the evidence drawn on the map and a confidence score you
            can inspect.
          </p>

          <div
            style={{
              background: "var(--sq-panel)",
              borderRadius: 24,
              padding: 20,
              display: "flex",
              flexDirection: "column",
              gap: 12,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "baseline",
                gap: 8,
                minHeight: 44,
              }}
            >
              <span
                style={{ fontSize: 18, lineHeight: 1.3, textWrap: "pretty" }}
              >
                {d.q.slice(0, s.chars)}
              </span>
              <span
                style={{
                  width: 1.5,
                  height: 18,
                  background: "var(--sq-ink)",
                  opacity: s.phase === "typing" ? 1 : 0.25,
                }}
              />
            </div>

            <div
              className="sq-scene sq-scene--current"
              style={{
                position: "relative",
                aspectRatio: "16 / 10",
                borderRadius: 16,
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  top: 0,
                  bottom: 0,
                  left: `${s.sweep}%`,
                  width: "16%",
                  background:
                    "linear-gradient(90deg,transparent,rgba(4,71,255,0.16),transparent)",
                  opacity: scanning ? 1 : 0,
                  transition: "left 0.25s linear, opacity 0.3s ease",
                }}
              />
              {d.boxes.map((b, n) => (
                <div
                  key={`${s.demo}-${n}`}
                  style={{
                    position: "absolute",
                    left: b.left,
                    top: b.top,
                    width: b.w,
                    height: b.h,
                    border: "1.5px solid var(--sq-orange)",
                    borderRadius: 3,
                    background: "rgba(255,71,4,0.10)",
                    opacity: result && n < s.revealed ? 1 : 0,
                    transition: "opacity 0.4s ease",
                  }}
                />
              ))}
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <span
                className="sq-mono"
                style={{
                  color: result ? "var(--sq-ink-soft)" : "var(--sq-faint)",
                  minHeight: 37,
                  textWrap: "pretty",
                }}
              >
                {phaseText}
              </span>
              <div style={{ display: "flex", gap: 6 }}>
                {DEMOS.map((_, n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => play(n)}
                    aria-label={`Show demo ${n + 1}`}
                    style={{
                      cursor: "pointer",
                      padding: 0,
                      width: 7,
                      height: 7,
                      borderRadius: 9999,
                      border: "none",
                      background:
                        n === s.demo ? "var(--sq-ink)" : "var(--sq-disabled)",
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </header>

      <section
        className="sq-pad"
        style={{ maxWidth: 1280, margin: "0 auto", padding: "0 64px 96px" }}
      >
        <div
          className="sq-home-steps"
          style={{
            background: "var(--sq-panel)",
            borderRadius: 24,
            padding: 32,
            display: "grid",
            gridTemplateColumns: "repeat(4, minmax(0,1fr))",
            gap: 32,
          }}
        >
          {HOME_STEPS.map((st) => (
            <Link
              key={st.n}
              to={st.to}
              className="sq-home-step"
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 8,
                textDecoration: "none",
                color: "var(--sq-ink)",
                padding: 16,
                margin: -16,
                borderRadius: 16,
                transition: "background 0.2s ease",
              }}
            >
              <span className="sq-mono" style={{ color: "var(--sq-faint)" }}>
                {st.n}
              </span>
              <span style={{ fontSize: 18, lineHeight: 1.35 }}>{st.title}</span>
              <span
                style={{
                  fontSize: 14,
                  lineHeight: 1.5,
                  letterSpacing: "0.14px",
                  color: "var(--sq-muted)",
                  textWrap: "pretty",
                }}
              >
                {st.body}
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section
        className="sq-pad"
        style={{
          maxWidth: 1280,
          margin: "0 auto",
          padding: "0 64px 96px",
          borderTop: "1px solid var(--sq-rule)",
        }}
      >
        <h2 className="sq-h3" style={{ margin: "64px 0 32px" }}>
          Example questions
        </h2>
        <div
          className="sq-examples"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, minmax(0,1fr))",
            gap: 24,
          }}
        >
          {DEMOS.map((e, n) => {
            const on = n === s.demo;
            return (
              <button
                key={e.who}
                type="button"
                onClick={() => play(n)}
                style={{
                  cursor: "pointer",
                  textAlign: "left",
                  fontFamily: "inherit",
                  display: "flex",
                  flexDirection: "column",
                  gap: 8,
                  padding: "20px 0 0",
                  background: "transparent",
                  border: "none",
                  borderTop: `1.5px solid ${on ? "var(--sq-ink)" : "var(--sq-rule)"}`,
                  transition: "border-color 0.2s ease",
                }}
              >
                <span className="sq-mono" style={{ color: "var(--sq-faint)" }}>
                  {e.who}
                </span>
                <span
                  style={{
                    fontSize: 20,
                    lineHeight: 1.35,
                    color: on ? "var(--sq-ink)" : "var(--sq-ink-soft)",
                    textWrap: "pretty",
                  }}
                >
                  {e.q}
                </span>
                <span
                  style={{
                    fontSize: 14,
                    letterSpacing: "0.14px",
                    color: "var(--sq-muted)",
                  }}
                >
                  {on ? "Playing above" : e.action}
                </span>
              </button>
            );
          })}
        </div>
      </section>
    </div>
  );
}
