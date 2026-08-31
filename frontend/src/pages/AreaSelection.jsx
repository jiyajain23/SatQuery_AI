import { AOI_SIZES, GOALS } from "@/data/mockData";
import { TopNav } from "@/components/TopNav";
import { AreaMap } from "@/components/AreaMap";
import { Pill, PillLink } from "@/components/Pill";
import { useSatQuery } from "@/context/SatQueryContext";

export default function AreaSelection() {
  const sq = useSatQuery();
  const goal = GOALS.find((g) => g.id === sq.goal);
  const ready = !!sq.place.trim() && !!goal;
  const hectares = sq.hectares.toLocaleString();

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--sq-bg)",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <TopNav current={0} reachable={ready ? 1 : 0} />

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
        <h1 className="sq-h2">Where do you want to look?</h1>

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <input
              type="text"
              className="sq-input"
              value={sq.place}
              onChange={(e) => sq.patch({ place: e.target.value })}
              placeholder="Search a place or paste coordinates"
              aria-label="Area"
              style={{ flex: 1, minWidth: 0 }}
            />
            <Pill
              size="lg"
              onClick={() =>
                sq.patch({
                  place: "Custom boundary",
                  size: 34,
                  cx: 46,
                  cy: 46,
                })
              }
            >
              Draw
            </Pill>
            <Pill
              size="lg"
              onClick={() =>
                sq.patch({
                  place: "block-12.geojson",
                  size: 22,
                  cx: 40,
                  cy: 52,
                })
              }
            >
              Upload boundary
            </Pill>
          </div>

          <AreaMap
            cx={sq.cx}
            cy={sq.cy}
            size={sq.size}
            note={`AOI-KRB-114 · ${hectares} ha · ${sq.lat} N, ${sq.lon} E`}
            onPick={(p) => sq.patch(p)}
          >
            <div
              style={{
                position: "absolute",
                right: 20,
                top: 16,
                display: "flex",
                gap: 6,
              }}
            >
              {AOI_SIZES.map((z) => (
                <Pill
                  key={z.label}
                  size="sm"
                  selected={z.v === sq.size}
                  onClick={(e) => {
                    e.stopPropagation();
                    sq.patch({ size: z.v });
                  }}
                >
                  {z.label}
                </Pill>
              ))}
            </div>
          </AreaMap>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <span
            style={{
              fontSize: 14,
              letterSpacing: "0.14px",
              color: "var(--sq-muted)",
            }}
          >
            What do you want to know?
          </span>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {GOALS.map((g) => (
              <Pill
                key={g.id}
                selected={g.id === sq.goal}
                onClick={() => sq.patch({ goal: g.id })}
              >
                {g.title}
              </Pill>
            ))}
          </div>
          <p
            style={{
              fontSize: 14,
              lineHeight: 1.5,
              letterSpacing: "0.14px",
              color: "var(--sq-muted)",
              margin: 0,
              textWrap: "pretty",
            }}
          >
            {goal ? goal.note : ""}
          </p>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            paddingTop: 24,
            borderTop: "1px solid var(--sq-rule)",
          }}
        >
          <PillLink to="/imagery" solid size="lg" disabled={!ready}>
            Continue
          </PillLink>
          <span className="sq-mono" style={{ color: "var(--sq-faint)" }}>
            {ready
              ? `${sq.place} · ${hectares} ha`
              : "Set an area to continue"}
          </span>
        </div>
      </main>
    </div>
  );
}
