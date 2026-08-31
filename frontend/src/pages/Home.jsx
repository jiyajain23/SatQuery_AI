import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Satellite, Sparkles, ShieldCheck, Cpu, ArrowRight } from "lucide-react";
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
      ? "interpreting query…"
      : scanning
        ? "fusing optical & radar channels…"
        : d.result;

  return (
    <div style={{ minHeight: "100vh", background: "transparent" }}>
      <nav
        className="sq-pad"
        style={{
          maxWidth: 1280,
          margin: "0 auto",
          padding: "16px 48px",
          display: "flex",
          alignItems: "center",
          gap: 24,
          borderBottom: "1px solid var(--sq-rule)",
          backdropFilter: "blur(12px)",
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
            fontSize: 17,
            letterSpacing: "-0.02em",
          }}
        >
          <span
            style={{
              display: "inline-grid",
              placeItems: "center",
              width: 32,
              height: 32,
              borderRadius: 8,
              background: "linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)",
              color: "#ffffff",
              boxShadow: "0 0 16px rgba(99, 102, 241, 0.4)",
            }}
          >
            <Satellite size={17} strokeWidth={2.2} />
          </span>
          <span
            style={{
              background: "linear-gradient(135deg, #ffffff 40%, #94a3b8 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            SatQuery <span style={{ color: "#38bdf8", WebkitTextFillColor: "#38bdf8", fontWeight: 700 }}>AI</span>
          </span>
          <span
            className="sq-mono"
            style={{
              fontSize: 10,
              padding: "2px 8px",
              borderRadius: 9999,
              background: "rgba(56, 189, 248, 0.1)",
              color: "#38bdf8",
              border: "1px solid rgba(56, 189, 248, 0.25)",
              marginLeft: 4,
            }}
          >
            ISRO / SAC · SIH 2026
          </span>
        </Link>
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
          Workflow
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
          Live Answer Demo
        </Link>
        <PillLink to="/area" solid>
          Start Analysis <ArrowRight size={14} />
        </PillLink>
      </nav>

      <header
        className="sq-pad sq-home-hero"
        style={{
          maxWidth: 1280,
          margin: "0 auto",
          padding: "80px 48px 64px",
          display: "grid",
          gridTemplateColumns: "minmax(0,7fr) minmax(0,5fr)",
          gap: 64,
          alignItems: "start",
        }}
      >
        <div>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "6px 14px",
              borderRadius: 9999,
              background: "rgba(99, 102, 241, 0.15)",
              border: "1px solid rgba(99, 102, 241, 0.3)",
              color: "#a5b4fc",
              fontSize: 13,
              marginBottom: 20,
            }}
          >
            <Sparkles size={13} />
            <span>Agentic Vision-Language Geospatial Assistant</span>
          </div>

          <h1 className="sq-h1" style={{ marginBottom: 24 }}>
            Query Earth from space in natural language.
          </h1>

          <p
            style={{
              fontSize: 16,
              lineHeight: 1.6,
              letterSpacing: "0.16px",
              color: "var(--sq-muted)",
              margin: "0 0 32px",
              maxWidth: "52ch",
            }}
          >
            SatQuery AI validates satellite imagery, dynamically routes specialist vision models,
            fuses optical and radar (SAR) observations, and returns evidence-grounded spatial answers with calibrated confidence.
          </p>

          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 36 }}>
            <PillLink to="/area" solid size="lg">
              Start an analysis <ArrowRight size={15} />
            </PillLink>
            <PillLink to="/results" size="lg">
              View sample report
            </PillLink>
          </div>

          <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
            {[
              { icon: Cpu, label: "Agentic Tool Registry" },
              { icon: Satellite, label: "Optical + SAR Fusion" },
              { icon: ShieldCheck, label: "Hallucination Guard" },
            ].map((t) => (
              <span
                key={t.label}
                className="sq-mono"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  fontSize: 12,
                  color: "var(--sq-faint)",
                  background: "rgba(255, 255, 255, 0.03)",
                  padding: "4px 10px",
                  borderRadius: 6,
                  border: "1px solid var(--sq-rule)",
                }}
              >
                <t.icon size={13} color="#38bdf8" />
                {t.label}
              </span>
            ))}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div
            className="sq-panel sq-glow-border"
            style={{
              borderRadius: 24,
              padding: 24,
              display: "flex",
              flexDirection: "column",
              gap: 16,
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
                style={{ fontSize: 18, lineHeight: 1.3, textWrap: "pretty", color: "var(--sq-ink)" }}
              >
                {d.q.slice(0, s.chars)}
              </span>
              <span
                style={{
                  width: 2,
                  height: 18,
                  background: "var(--sq-cyan)",
                  boxShadow: "0 0 8px var(--sq-cyan)",
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
                border: "1px solid rgba(255, 255, 255, 0.12)",
              }}
            >
              <img
                src="/demo/satellite_hero.jpg"
                alt="Satellite imagery of agricultural farmland"
                style={{
                  position: "absolute",
                  inset: 0,
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                }}
              />
              <div
                style={{
                  position: "absolute",
                  top: 0,
                  bottom: 0,
                  left: `${s.sweep}%`,
                  width: "18%",
                  background:
                    "linear-gradient(90deg, transparent, rgba(0, 240, 255, 0.35), rgba(99, 102, 241, 0.5), transparent)",
                  boxShadow: "0 0 20px rgba(0, 240, 255, 0.4)",
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
                    border: "2px solid #ff5500",
                    borderRadius: 4,
                    background: "rgba(255, 85, 0, 0.22)",
                    boxShadow: "0 0 12px rgba(255, 85, 0, 0.4)",
                    opacity: result && n < s.revealed ? 1 : 0,
                    transition: "opacity 0.4s ease",
                  }}
                />
              ))}
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <span
                  className="sq-mono"
                  style={{
                    color: result ? "#34d399" : "#38bdf8",
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  <span
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: 9999,
                      background: result ? "#34d399" : "#38bdf8",
                      boxShadow: `0 0 8px ${result ? "#34d399" : "#38bdf8"}`,
                    }}
                  />
                  {phaseText}
                </span>
                <span className="sq-mono" style={{ color: "var(--sq-faint)", fontSize: 11 }}>
                  {DEMOS[s.demo].who}
                </span>
              </div>
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
                      width: n === s.demo ? 24 : 7,
                      height: 7,
                      borderRadius: 9999,
                      border: "none",
                      background:
                        n === s.demo ? "#38bdf8" : "rgba(255, 255, 255, 0.15)",
                      transition: "all 0.25s ease",
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
        style={{ maxWidth: 1280, margin: "0 auto", padding: "0 48px 80px" }}
      >
        <div
          className="sq-home-steps"
          style={{
            background: "var(--sq-panel)",
            border: "1px solid var(--sq-rule)",
            borderRadius: 24,
            padding: 36,
            display: "grid",
            gridTemplateColumns: "repeat(4, minmax(0,1fr))",
            gap: 24,
            backdropFilter: "blur(16px)",
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
                gap: 10,
                textDecoration: "none",
                color: "var(--sq-ink)",
                padding: 20,
                borderRadius: 16,
                background: "rgba(255, 255, 255, 0.02)",
                border: "1px solid rgba(255, 255, 255, 0.04)",
                transition: "all 0.25s ease",
              }}
            >
              <span
                className="sq-mono"
                style={{
                  color: "#38bdf8",
                  fontSize: 12,
                  fontWeight: 600,
                }}
              >
                STEP {st.n}
              </span>
              <span style={{ fontSize: 18, lineHeight: 1.35, fontWeight: 500 }}>{st.title}</span>
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
          padding: "0 48px 96px",
          borderTop: "1px solid var(--sq-rule)",
        }}
      >
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", margin: "64px 0 32px" }}>
          <h2 className="sq-h3" style={{ margin: 0 }}>
            Operational Use-Cases
          </h2>
          <span className="sq-mono" style={{ color: "var(--sq-faint)" }}>
            Agriculture · Disaster Relief · Urban Expansion
          </span>
        </div>
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
                  gap: 12,
                  padding: 24,
                  background: on ? "rgba(99, 102, 241, 0.08)" : "var(--sq-panel)",
                  borderRadius: 16,
                  border: `1px solid ${on ? "#6366f1" : "var(--sq-rule)"}`,
                  boxShadow: on ? "0 0 20px rgba(99, 102, 241, 0.2)" : "none",
                  transition: "all 0.25s ease",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", width: "100%" }}>
                  <span
                    className="sq-mono"
                    style={{
                      color: on ? "#38bdf8" : "var(--sq-faint)",
                      fontSize: 12,
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                    }}
                  >
                    {e.who}
                  </span>
                  <span
                    className="sq-mono"
                    style={{
                      fontSize: 11,
                      color: on ? "#34d399" : "var(--sq-faint)",
                    }}
                  >
                    {on ? "● ACTIVE" : "PLAY DEMO"}
                  </span>
                </div>
                <span
                  style={{
                    fontSize: 18,
                    lineHeight: 1.35,
                    color: on ? "var(--sq-ink)" : "var(--sq-ink-soft)",
                    textWrap: "pretty",
                    fontWeight: 500,
                  }}
                >
                  "{e.q}"
                </span>
                <span
                  style={{
                    fontSize: 13,
                    color: on ? "#a5b4fc" : "var(--sq-muted)",
                    paddingTop: 8,
                    borderTop: "1px solid var(--sq-rule)",
                  }}
                >
                  Expected Grounding: {e.result}
                </span>
              </button>
            );
          })}
        </div>
      </section>
    </div>
  );
}
