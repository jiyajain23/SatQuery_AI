import { Link } from "@tanstack/react-router";
import { Satellite } from "lucide-react";
import { StepNav } from "@/components/StepNav";

/** Brand + step pills header used by the wizard screens. */
export function TopNav({ current, reachable }) {
  return (
    <nav
      className="sq-pad"
      style={{
        maxWidth: 1280,
        width: "100%",
        margin: "0 auto",
        padding: "16px 48px",
        display: "flex",
        alignItems: "center",
        gap: 20,
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
          ISRO / SAC
        </span>
      </Link>
      <div style={{ flex: 1 }} />
      <StepNav current={current} reachable={reachable} />
    </nav>
  );
}
