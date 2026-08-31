import { Link } from "@tanstack/react-router";
import { StepNav } from "@/components/StepNav";

/** Brand + step pills header used by the three wizard screens. */
export function TopNav({ current, reachable }) {
  return (
    <nav
      className="sq-pad"
      style={{
        maxWidth: 1280,
        width: "100%",
        margin: "0 auto",
        padding: "20px 64px",
        display: "flex",
        alignItems: "center",
        gap: 16,
        borderBottom: "1px solid var(--sq-rule)",
      }}
    >
      <Link
        to="/"
        style={{ fontWeight: 500, fontSize: 16, textDecoration: "none" }}
      >
        SatQuery
      </Link>
      <div style={{ flex: 1 }} />
      <StepNav current={current} reachable={reachable} />
    </nav>
  );
}
