import { Link } from "@tanstack/react-router";
import { STEPS } from "@/data/mockData";

/**
 * Numbered step pills, shared by the Area / Imagery / Question / Answer
 * screens. `current` highlights a step; `reachable` is the highest index
 * the user has unlocked.
 */
export function StepNav({ current, reachable }) {
  return (
    <div
      className="sq-stepnav"
      style={{ display: "flex", alignItems: "center", gap: 4, flexShrink: 0 }}
    >
      {STEPS.map((s, i) => {
        const on = i === current;
        const open = i <= reachable;
        const content = (
          <>
            <span
              className="sq-mono"
              style={{ opacity: 0.6, fontSize: 13 }}
            >
              {s.n}
            </span>
            {s.label}
          </>
        );
        const style = {
          background: on ? "var(--sq-panel)" : "transparent",
          color: on
            ? "var(--sq-ink)"
            : open
              ? "var(--sq-muted)"
              : "var(--sq-disabled)",
        };
        if (!open) {
          return (
            <span
              key={s.n}
              className="sq-pill sq-pill--nav"
              style={{ ...style, pointerEvents: "none" }}
            >
              {content}
            </span>
          );
        }
        return (
          <Link
            key={s.n}
            to={s.to}
            className="sq-pill sq-pill--nav"
            style={style}
          >
            {content}
          </Link>
        );
      })}
    </div>
  );
}
