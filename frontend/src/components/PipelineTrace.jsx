import { useState } from "react";
import { CheckCircle2, ChevronDown, ChevronUp, Cpu, Wrench } from "lucide-react";

const ALL_TOOLS = [
  {
    id: "change_detect",
    name: "change_detect",
    desc: "OpenCV bi-temporal contour & parcel area estimator",
    modality: "Bi-temporal",
    matchTasks: ["bitemporal_change", "change_decline", "crop"],
  },
  {
    id: "vision_vqa",
    name: "vision_vqa",
    desc: "RS-adapted multimodal reasoning (BigEarthNet / LoRA)",
    modality: "All",
    matchTasks: ["bitemporal_change", "single_image_vqa", "scene_description", "crop"],
  },
  {
    id: "sar_optical_fusion",
    name: "sar_optical_fusion",
    desc: "Dual-branch radar backscatter (dB) & optical NDVI cross-check",
    modality: "Cross-modal",
    matchTasks: ["bitemporal_change", "crop"],
  },
  {
    id: "single_image_vqa",
    name: "single_image_vqa",
    desc: "Single scene land-cover captioner & grounding baseline",
    modality: "Single-image",
    matchTasks: ["single_image_vqa", "scene_description"],
  },
  {
    id: "grounding_dino",
    name: "grounding_dino",
    desc: "Text-guided bounding box object detector (VRSBench / RSVQA)",
    modality: "Grounding",
    matchTasks: ["grounding", "object_count"],
  },
];

/**
 * The agentic execution trace + auditable Tool Registry summary.
 */
export function PipelineTrace({ steps, activeIndex, running, taskPlan }) {
  const [showTools, setShowTools] = useState(true);
  const taskType = taskPlan?.task_type || (steps?.length > 4 ? "bitemporal_change" : "single_image_vqa");

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 16,
        background: "rgba(15, 23, 42, 0.6)",
        border: "1px solid var(--sq-rule)",
        borderRadius: 16,
        padding: "20px 24px",
        backdropFilter: "blur(12px)",
      }}
    >
      {/* Step-by-step pipeline execution */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {steps.map((label, i) => {
          const done = !running || i < activeIndex;
          const active = running && i === activeIndex;
          const pending = running && i > activeIndex;

          return (
            <div
              key={label}
              style={{
                display: "grid",
                gridTemplateColumns: "18px minmax(0,1fr)",
                gap: 12,
                alignItems: "center",
              }}
            >
              {done ? (
                <CheckCircle2 size={15} color="#34d399" />
              ) : active ? (
                <span
                  className="sq-pulse"
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: 9999,
                    background: "var(--sq-cyan)",
                    boxShadow: "0 0 10px var(--sq-cyan)",
                    display: "inline-block",
                  }}
                />
              ) : (
                <span
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: 9999,
                    background: "var(--sq-rule-strong)",
                    marginLeft: 2,
                    display: "inline-block",
                  }}
                />
              )}
              <span
                style={{
                  fontSize: 14,
                  letterSpacing: "0.14px",
                  color: pending ? "var(--sq-faint)" : active ? "var(--sq-cyan)" : "var(--sq-ink-soft)",
                  fontWeight: active ? 500 : 400,
                  textWrap: "pretty",
                }}
              >
                {label}
                {active ? "…" : ""}
              </span>
            </div>
          );
        })}
      </div>

      {/* Tool Registry Audit Summary (PS Requirement) */}
      <div
        style={{
          borderTop: "1px solid var(--sq-rule)",
          paddingTop: 12,
          display: "flex",
          flexDirection: "column",
          gap: 10,
        }}
      >
        <button
          type="button"
          onClick={() => setShowTools((v) => !v)}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            background: "transparent",
            border: "none",
            color: "var(--sq-muted)",
            cursor: "pointer",
            padding: 0,
            fontSize: 13,
            fontWeight: 500,
          }}
        >
          <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <Cpu size={14} color="#38bdf8" />
            <span style={{ color: "var(--sq-ink-soft)" }}>Agentic Tool Registry</span>
            <span className="sq-mono" style={{ fontSize: 11, color: "var(--sq-faint)" }}>
              (Auditable Execution Summary)
            </span>
          </span>
          {showTools ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>

        {showTools && (
          <div style={{ display: "flex", flexDirection: "column", gap: 6, paddingTop: 4 }}>
            {ALL_TOOLS.map((tool) => {
              const isSelected = tool.matchTasks.includes(taskType);

              return (
                <div
                  key={tool.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 12,
                    padding: "6px 10px",
                    borderRadius: 8,
                    background: isSelected ? "rgba(16, 185, 129, 0.06)" : "rgba(255, 255, 255, 0.02)",
                    border: `1px solid ${isSelected ? "rgba(16, 185, 129, 0.25)" : "var(--sq-rule)"}`,
                  }}
                >
                  <div style={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span
                        className="sq-mono"
                        style={{
                          fontSize: 12,
                          fontWeight: 600,
                          color: isSelected ? "#34d399" : "var(--sq-muted)",
                        }}
                      >
                        {tool.name}
                      </span>
                      <span
                        style={{
                          fontSize: 10,
                          padding: "1px 6px",
                          borderRadius: 4,
                          background: "rgba(255, 255, 255, 0.05)",
                          color: "var(--sq-faint)",
                        }}
                      >
                        {tool.modality}
                      </span>
                    </div>
                    <span
                      style={{
                        fontSize: 11,
                        color: "var(--sq-faint)",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {tool.desc}
                    </span>
                  </div>

                  <span
                    className={`sq-tool-tag ${isSelected ? "sq-tool-tag--selected" : "sq-tool-tag--skipped"}`}
                    style={{ flexShrink: 0 }}
                  >
                    {isSelected ? "✅ SELECTED" : "⬚ SKIPPED"}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
