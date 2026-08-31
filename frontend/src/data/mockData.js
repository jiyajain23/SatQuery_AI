// Mock data extracted from the original SatQuery HTML mockups.
// Kept separate from components so screens stay presentational.

export const VIOLET = "#0447ff";
export const ORANGE = "#ff4704";

export const STEPS = [
  { n: "01", label: "Area", to: "/area" },
  { n: "02", label: "Imagery", to: "/imagery" },
  { n: "03", label: "Question", to: "/question" },
  { n: "04", label: "Answer", to: "/results" },
];

/* ── Home ───────────────────────────────────────────────────────────── */

export const DEMOS = [
  {
    who: "Agriculture",
    q: "Has the paddy in this block declined since June?",
    action: "Watch it run",
    result: "38.6 ha declined · confidence 0.89",
    boxes: [
      { left: "46%", top: "22%", w: "20%", h: "22%" },
      { left: "44%", top: "56%", w: "17%", h: "18%" },
      { left: "71%", top: "38%", w: "15%", h: "17%" },
    ],
  },
  {
    who: "Disaster response",
    q: "Which settlements are still flooded?",
    action: "Watch it run",
    result: "4 settlements · 212 ha under water",
    boxes: [
      { left: "18%", top: "30%", w: "22%", h: "20%" },
      { left: "52%", top: "48%", w: "26%", h: "24%" },
      { left: "30%", top: "66%", w: "14%", h: "14%" },
      { left: "66%", top: "18%", w: "16%", h: "16%" },
    ],
  },
  {
    who: "Planning",
    q: "How much new construction since 2023?",
    action: "Watch it run",
    result: "61 new structures · 9.4 ha",
    boxes: [
      { left: "24%", top: "24%", w: "12%", h: "12%" },
      { left: "42%", top: "40%", w: "10%", h: "10%" },
      { left: "58%", top: "60%", w: "14%", h: "13%" },
    ],
  },
];

export const HOME_STEPS = [
  {
    n: "01",
    title: "Choose an area",
    body: "Search a place, draw a boundary, or upload one.",
    to: "/area",
  },
  {
    n: "02",
    title: "Provide imagery",
    body: "Pull free public scenes, or upload your own.",
    to: "/imagery",
  },
  {
    n: "03",
    title: "Ask a question",
    body: "Plain language. No model or parameter choices.",
    to: "/question",
  },
  {
    n: "04",
    title: "Read the answer",
    body: "Evidence on the map, confidence, PDF and GeoJSON.",
    to: "/results",
  },
];

/* ── Area selection ─────────────────────────────────────────────────── */

export const GOALS = [
  {
    id: "crop",
    title: "Crop condition",
    note: "Optical and radar are combined and compared against an earlier baseline, so cloud does not block the reading.",
  },
  {
    id: "flood",
    title: "Flooding",
    note: "Radar-led comparison between two dates returns the water extent and its area.",
  },
  {
    id: "built",
    title: "Construction",
    note: "Built-up change between two dates, exported as parcels you can open in GIS.",
  },
  {
    id: "forest",
    title: "Vegetation loss",
    note: "Cover lost between two dates, with a confidence figure per patch.",
  },
  {
    id: "count",
    title: "Count objects",
    note: "Ships, tanks, aircraft or structures located in a single scene.",
  },
];

export const AOI_SIZES = [
  { label: "Small", v: 22 },
  { label: "Medium", v: 34 },
  { label: "Large", v: 52 },
];

/* ── Imagery ────────────────────────────────────────────────────────── */

export const BASE_SCENES = [
  {
    id: "a",
    plain: "Optical photograph · 14 July 2026",
    file: "S2A_MSIL2A_20260714_KRB.tif · 10 m · 214 MB",
  },
  {
    id: "b",
    plain: "Radar, sees through cloud · 13 July 2026",
    file: "S1A_IW_GRDH_20260713_KRB.tif · 10 m · 186 MB",
  },
  {
    id: "c",
    plain: "Radar baseline for comparison · 2 June 2026",
    file: "S1A_IW_GRDH_20260602_KRB.tif · 10 m · 181 MB",
  },
];

export const BAD_SCENE = {
  id: "x",
  plain: "Radar · 8 March 2019 — added by you",
  file: "RISAT1A_FRS1_20190308.tif · 2.5 m · 402 MB",
};

export const FAILURE_TITLE =
  "The 2019 scene you added cannot be compared with the others.";

export const FAILURE_REASONS = [
  "It sits on a different map grid, so its pixels do not line up — ground features are offset by 6.9 pixels against a 1.5 pixel tolerance.",
  "It is 7 years older than the rest, well outside the comparison window for crop condition.",
  "Correcting it takes about 40 seconds. Until then it is excluded rather than quietly averaged in.",
];

export function buildChecks(checking, bad) {
  return [
    {
      label: "File format and bands",
      plain: "Readable, with the bands the analysis needs.",
      value: checking ? "…" : "pass",
      ok: true,
    },
    {
      label: "Map projection",
      plain: "All scenes on the same grid.",
      value: checking ? "…" : bad ? "mismatch" : "pass",
      ok: !bad,
    },
    {
      label: "Alignment",
      plain: "The same ground point lands on the same pixel.",
      value: checking ? "…" : bad ? "6.9 px off" : "0.42 px",
      ok: !bad,
    },
    {
      label: "Cloud cover",
      plain: "Optical is 61% obscured; radar carries the reading.",
      value: checking ? "…" : "61%",
      ok: false,
    },
    {
      label: "Date spacing",
      plain: "Close enough for a like-for-like comparison.",
      value: checking ? "…" : bad ? "7 y 4 m" : "41 days",
      ok: !bad,
    },
    {
      label: "Coverage",
      plain: "Every scene covers the whole boundary.",
      value: checking ? "…" : "100%",
      ok: true,
    },
  ];
}

/* ── Question ───────────────────────────────────────────────────────── */

export const PROMPTS = [
  "Has the paddy in this block declined since June?",
  "Which parcels are worst affected?",
  "How many hectares are affected in total?",
];

export function interpretTokens(query) {
  const l = query.toLowerCase();
  const t = [];
  if (/paddy|crop|rice|field/.test(l)) t.push("subject: paddy");
  if (/parcel|block|area|field/.test(l)) t.push("scope: per parcel");
  if (/june|since|change|declin|compare/.test(l)) t.push("time: since June");
  if (/hectare|how many|area|total/.test(l)) t.push("output: hectares");
  if (/water|flood|logging|harvest/.test(l)) t.push("cause: water vs. harvest");
  return t.length ? t : ["reading your question…"];
}

/* ── Results ────────────────────────────────────────────────────────── */

// The agentic pipeline, exposed as the run trace on the answer screen.
export const MAIN_STEPS = [
  "Read the question and chose the comparison",
  "Compared radar against the June baseline",
  "Read the optical scene where it is clear of cloud",
  "Checked the two readings against each other",
  "Wrote the answer and drew the evidence",
];

export const FOLLOW_STEPS = [
  "Reused the evidence from the first answer",
  "Ranked the parcels by size of decline",
];

export const REGIONS = [
  {
    id: "12-A",
    left: "46%",
    top: "22%",
    w: "20%",
    h: "22%",
    label: "parcel 12-A",
    tone: ORANGE,
    fill: "rgba(255,71,4,0.10)",
    side: "left",
    ha: "14.2 ha",
    drop: "−3.1 dB radar · NDVI 0.71 → 0.49",
  },
  {
    id: "12-C",
    left: "44%",
    top: "56%",
    w: "17%",
    h: "18%",
    label: "parcel 12-C",
    tone: ORANGE,
    fill: "rgba(255,71,4,0.08)",
    side: "left",
    ha: "13.1 ha",
    drop: "−2.6 dB radar · NDVI 0.70 → 0.53",
  },
  {
    id: "13-A",
    left: "71%",
    top: "38%",
    w: "15%",
    h: "17%",
    label: "parcel 13-A",
    tone: ORANGE,
    fill: "rgba(255,71,4,0.07)",
    side: "right",
    ha: "11.3 ha",
    drop: "−2.4 dB radar · NDVI 0.72 → 0.55",
  },
];

export const FOCUS_REGIONS = [{ ...REGIONS[0], label: "worst affected · 12-A" }];

export const MAIN_ANSWER = {
  isAnswer: true,
  headline:
    "Yes. About 38.6 hectares of the block — roughly a third — has declined since June.",
  body: [
    "Cloud covered 61% of the optical photograph on 14 July, so radar carried the comparison. Radar returns dropped sharply over three neighbouring parcels in the north-east, the pattern you see when a crop is flattened or standing in water rather than harvested.",
    "On the clear 39% of the area, the optical scene agrees: vegetation vigour fell from 0.71 to 0.52 over the same parcels.",
  ],
  conf: "0.89",
  confWord: "high",
  factors: [
    {
      name: "Model certainty",
      value: "0.91",
      note: "Calibrated against held-out scenes, not a raw model score.",
    },
    {
      name: "Agreement between the two readings",
      value: "0.86",
      note: "Radar and optical outline nearly the same area.",
    },
    {
      name: "Input quality",
      value: "0.94",
      note: "Scenes aligned to 0.42 px; a penalty was applied for cloud.",
    },
  ],
};

export const FOLLOW_ANSWER = {
  isAnswer: true,
  headline: "Parcel 12-A, at 14.2 hectares, has fallen furthest.",
  body: [
    "Its radar return dropped 3.1 dB against June, compared with 2.6 dB on 12-C and 2.4 dB on 13-A. It also sits lowest in the block, next to the eastern drain, which fits standing water rather than pest damage.",
  ],
  conf: "0.93",
  confWord: "high",
  factors: [
    {
      name: "Model certainty",
      value: "0.95",
      note: "Clear margin over the next-ranked parcel.",
    },
    {
      name: "Agreement between the two readings",
      value: "0.91",
      note: "Both readings pick the same parcel first.",
    },
    {
      name: "Input quality",
      value: "0.94",
      note: "Unchanged from the first answer; nothing re-ingested.",
    },
  ],
};

export const LEGEND = [
  { tone: ORANGE, text: "Declined since June" },
  { tone: "#a59f97", text: "Cloud on the optical scene · 61%" },
  { tone: VIOLET, text: "Radar coverage" },
];

export const FOLLOW_SUGGESTIONS = [
  { label: "Which parcel is worst affected?", kind: "follow" },
  { label: "Is this water-logging or harvest?", kind: "main" },
];

/* ── Mock agentic analysis pipeline (Question → Results hand-off) ────── */

export const PIPELINE_STAGES = [
  { stage: "Input Validator", label: "Validating imagery" },
  { stage: "Input Validator", label: "Checking resolution and alignment" },
  { stage: "Query Planner", label: "Planning the query" },
  { stage: "Query Planner", label: "Selecting the analysis model" },
  { stage: "Specialist Analysis", label: "Comparing satellite scenes" },
  { stage: "Evidence Validator", label: "Validating evidence" },
  { stage: "Confidence Aggregator", label: "Aggregating confidence" },
  { stage: "Explainable Response", label: "Generating the response" },
];
