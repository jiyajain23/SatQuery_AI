/** Confidence panel with the expandable scoring breakdown. */
export function ConfidenceScore({ value, word, factors, open, onToggle }) {
  return (
    <div
      className="sq-panel"
      style={{
        padding: "24px 32px",
        display: "flex",
        flexDirection: "column",
        gap: 16,
      }}
    >
      <div style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
        <span
          style={{
            fontWeight: 300,
            fontSize: 32,
            lineHeight: 1,
            letterSpacing: "-0.64px",
          }}
        >
          {value}
        </span>
        <span
          style={{
            fontSize: 14,
            letterSpacing: "0.14px",
            color: "var(--sq-muted)",
          }}
        >
          confidence · {word}
        </span>
        <div style={{ flex: 1 }} />
        <button type="button" className="sq-linkbtn" onClick={onToggle}>
          {open ? "Hide detail" : "How was this scored?"}
        </button>
      </div>
      {open && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {factors.map((f) => (
            <div
              key={f.name}
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 4,
                paddingTop: 12,
                borderTop: "1px solid var(--sq-rule)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: 12,
                  fontSize: 14,
                  letterSpacing: "0.14px",
                }}
              >
                <span>{f.name}</span>
                <span className="sq-mono" style={{ color: "var(--sq-muted)" }}>
                  {f.value}
                </span>
              </div>
              <span
                style={{
                  fontSize: 14,
                  letterSpacing: "0.14px",
                  color: "var(--sq-faint)",
                  textWrap: "pretty",
                }}
              >
                {f.note}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
