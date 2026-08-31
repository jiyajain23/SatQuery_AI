import { CheckCircle2, Loader2, XCircle } from "lucide-react";

/** One imagery row: thumbnail, plain-language name, filename, check state. */
export function SceneRow({ scene, first, expanded, state, onToggle }) {
  const thumb = expanded ? "132px" : "44px";
  const isBad = scene.id === "x";
  const checking = state === "checking";
  const StateIcon = checking ? Loader2 : isBad ? XCircle : CheckCircle2;
  const baseline = scene.id === "c" || isBad;

  return (
    <div
      onClick={onToggle}
      style={{
        display: "grid",
        gridTemplateColumns: `${thumb} minmax(0,1fr) auto`,
        gap: 20,
        alignItems: "center",
        padding: "20px 0",
        borderTop: `1px solid ${first ? "transparent" : "var(--sq-rule)"}`,
        cursor: "pointer",
        transition: "grid-template-columns 0.2s ease",
      }}
    >
      <div
        className={`sq-scene ${baseline ? "sq-scene--baseline" : "sq-scene--current"}`}
        style={{
          width: thumb,
          height: thumb,
          borderRadius: 10,
          filter: isBad ? "grayscale(1)" : "none",
          transition: "width 0.2s ease, height 0.2s ease",
        }}
      />
      <div
        style={{
          minWidth: 0,
          display: "flex",
          flexDirection: "column",
          gap: 2,
        }}
      >
        <span style={{ fontSize: 16, letterSpacing: "0.16px" }}>
          {scene.plain}
        </span>
        <span
          className="sq-mono"
          style={{
            color: "var(--sq-faint)",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {scene.file}
        </span>
      </div>
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 7,
          fontSize: 14,
          fontWeight: 500,
          letterSpacing: "0.01em",
          padding: "5px 14px",
          borderRadius: 9999,
          color: checking
            ? "var(--sq-muted)"
            : isBad
              ? "var(--sq-bg)"
              : "var(--sq-ink-soft)",
          background: checking
            ? "var(--sq-rule)"
            : isBad
              ? "var(--sq-orange)"
              : "var(--sq-rule)",
        }}
      >
        <StateIcon
          size={14}
          strokeWidth={1.8}
          aria-hidden="true"
          className={checking ? "sq-spin" : undefined}
        />
        {state}
      </span>
    </div>
  );
}
