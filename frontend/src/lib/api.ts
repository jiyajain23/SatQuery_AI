const API_BASE = "/api";

export type ValidationCheck = {
  label: string;
  plain: string;
  value: string;
  ok: boolean;
};

export type ValidationResponse = {
  passed: boolean;
  checks: ValidationCheck[];
  failure_title?: string | null;
  failure_reasons?: string[];
  alignment_offset_px?: number | null;
  image_count: number;
};

export type TaskPlan = {
  task_type: "bitemporal_change" | "single_image_vqa";
  intent: string;
  specialists: string[];
  comparison?: { baseline_index: number; current_index: number } | null;
  output_format: string;
  interpretation: string;
  reasoning: string;
};

export type ConfidenceFactor = {
  name: string;
  value: string;
  note: string;
};

export type AnswerPayload = {
  isAnswer: boolean;
  headline: string;
  body: string[];
  conf: string;
  confWord: string;
  factors: ConfidenceFactor[];
};

export type RegionPayload = {
  id: string;
  left: string;
  top: string;
  w: string;
  h: string;
  label: string;
  tone: string;
  fill: string;
  side: "left" | "right";
  ha: string;
  drop: string;
};

export type AnalysisResult = {
  answer: AnswerPayload;
  regions: RegionPayload[];
  steps: string[];
  task_plan: TaskPlan;
  trace?: Record<string, unknown>[];
  meta?: Record<string, unknown>;
};

export type PipelineStageEvent = {
  stage: string;
  label: string;
  status: "running" | "done" | "error";
  index: number;
};

export type PlanPreviewResponse = {
  tokens: string[];
  interpretation: string;
  reasoning: string;
  task_plan?: TaskPlan | null;
};

export const DEMO_SCENES = {
  bitemporal: [
    {
      id: "baseline",
      plain: "Optical · 2 June 2026",
      file: "baseline_2026-06-02.jpg · 10 m · demo",
      url: "/demo/baseline_2026-06-02.jpg",
      acquiredAt: "2026-06-02",
    },
    {
      id: "current",
      plain: "Optical · 14 July 2026",
      file: "current_2026-07-14.jpg · 10 m · demo",
      url: "/demo/current_2026-07-14.jpg",
      acquiredAt: "2026-07-14",
    },
  ],
  single: [
    {
      id: "single",
      plain: "Optical · 14 July 2026",
      file: "current_2026-07-14.jpg · 10 m · demo",
      url: "/demo/current_2026-07-14.jpg",
      acquiredAt: "2026-07-14",
    },
  ],
  bad: {
    id: "x",
    plain: "Radar · 8 March 2019 — added by you",
    file: "misaligned_2019.jpg · 2.5 m · demo",
    url: "/demo/misaligned_2019.jpg",
    acquiredAt: "2019-03-08",
  },
};

async function fetchDemoImage(url: string, filename: string): Promise<File> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to load demo image: ${url}`);
  const blob = await res.blob();
  return new File([blob], filename, { type: blob.type || "image/jpeg" });
}

export async function loadDemoFiles(
  mode: "bitemporal" | "single",
): Promise<File[]> {
  const scenes = mode === "bitemporal" ? DEMO_SCENES.bitemporal : DEMO_SCENES.single;
  return Promise.all(
    scenes.map((s) => {
      const name = s.url.split("/").pop() || "demo.jpg";
      return fetchDemoImage(s.url, name);
    }),
  );
}

export async function loadBadDemoFile(): Promise<File> {
  const s = DEMO_SCENES.bad;
  const name = s.url.split("/").pop() || "misaligned.jpg";
  return fetchDemoImage(s.url, name);
}

function buildFormFiles(files: File[], extra?: Record<string, string>): FormData {
  const fd = new FormData();
  files.forEach((f) => fd.append("files", f));
  if (extra) {
    Object.entries(extra).forEach(([k, v]) => fd.append(k, v));
  }
  return fd;
}

export async function validateImages(
  files: File[],
  acquiredDates?: string[],
): Promise<ValidationResponse> {
  const fd = buildFormFiles(files, {
    acquired_dates: acquiredDates?.join(",") || "",
  });
  const res = await fetch(`${API_BASE}/validate`, { method: "POST", body: fd });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "Validation failed");
  }
  return res.json();
}

export async function previewPlan(
  query: string,
  imageCount: number,
  goal: string,
): Promise<PlanPreviewResponse> {
  const res = await fetch(`${API_BASE}/plan/preview`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query, image_count: imageCount, goal }),
  });
  if (!res.ok) throw new Error("Plan preview failed");
  return res.json();
}

export async function startAnalysis(
  query: string,
  files: File[],
  goal: string,
  aoiHectares: number,
): Promise<{ job_id: string }> {
  const fd = new FormData();
  fd.append("query", query);
  fd.append("goal", goal);
  fd.append("aoi_hectares", String(aoiHectares));
  files.forEach((f) => fd.append("files", f));
  const res = await fetch(`${API_BASE}/analyze`, { method: "POST", body: fd });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "Analysis failed to start");
  }
  return res.json();
}

export async function fetchJobResult(jobId: string): Promise<AnalysisResult | { status: string }> {
  const res = await fetch(`${API_BASE}/jobs/${jobId}/result`);
  if (!res.ok) throw new Error("Failed to fetch result");
  return res.json();
}

export async function waitForJobResult(
  jobId: string,
  maxAttempts = 40,
  delayMs = 250,
): Promise<AnalysisResult | null> {
  for (let i = 0; i < maxAttempts; i++) {
    const result = await fetchJobResult(jobId);
    if ("answer" in result && result.answer) return result as AnalysisResult;
    if (i < maxAttempts - 1) {
      await new Promise((r) => setTimeout(r, delayMs));
    }
  }
  return null;
}

export function subscribeToJob(
  jobId: string,
  onEvent: (event: PipelineStageEvent) => void,
  onDone: () => void,
  onError?: (err: Error) => void,
): () => void {
  const es = new EventSource(`${API_BASE}/jobs/${jobId}/events`);

  es.onmessage = (msg) => {
    try {
      const data = JSON.parse(msg.data);
      if (data.done) {
        es.close();
        onDone();
        return;
      }
      if (data.error) {
        es.close();
        onError?.(new Error(data.error));
        return;
      }
      onEvent(data as PipelineStageEvent);
    } catch (e) {
      onError?.(e instanceof Error ? e : new Error(String(e)));
    }
  };

  es.onerror = () => {
    es.close();
    onError?.(new Error("SSE connection lost"));
  };

  return () => es.close();
}

export async function checkApiHealth(): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/health`);
    return res.ok;
  } catch {
    return false;
  }
}
