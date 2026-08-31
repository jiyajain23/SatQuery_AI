import { createContext, useContext, useMemo, useState } from "react";

const SatQueryContext = createContext(null);

const INITIAL = {
  place: "Krishna delta, Andhra Pradesh",
  goal: "crop",
  cx: 46,
  cy: 46,
  size: 34,
  imagerySource: "auto",
  scenesReady: false,
  query: "Has the paddy in this block declined since June?",
  analysisMode: "bitemporal",
  imageFiles: [],
  sceneMeta: [],
  validation: null,
  taskPlan: null,
  jobId: null,
  jobResult: null,
};

export function SatQueryProvider({ children }) {
  const [state, setState] = useState(INITIAL);

  const value = useMemo(() => {
    const patch = (next) =>
      setState((prev) => ({
        ...prev,
        ...(typeof next === "function" ? next(prev) : next),
      }));
    const half = state.size / 2;
    const clamp = (v) => Math.min(100 - half, Math.max(half, v));
    const hectares = Math.round(state.size * state.size * 1.07);
    return {
      ...state,
      patch,
      reset: () => setState(INITIAL),
      hectares,
      lat: (16.52 + (46 - clamp(state.cy)) * 0.006).toFixed(2),
      lon: (81.04 + (clamp(state.cx) - 46) * 0.006).toFixed(2),
      areaReady: !!state.place.trim(),
      imageryReady: state.scenesReady && state.validation?.passed,
    };
  }, [state]);

  return (
    <SatQueryContext.Provider value={value}>{children}</SatQueryContext.Provider>
  );
}

export function useSatQuery() {
  const ctx = useContext(SatQueryContext);
  if (!ctx) throw new Error("useSatQuery must be used inside SatQueryProvider");
  return ctx;
}
