import { createFileRoute } from "@tanstack/react-router";
import Home from "@/pages/Home";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "SatQuery AI — Ask a plain question about a place" },
      {
        name: "description",
        content:
          "SatQuery selects satellite imagery, runs an agentic analysis, and returns an evidence-grounded answer with a confidence score you can inspect.",
      },
      {
        property: "og:title",
        content: "SatQuery AI — Ask a plain question about a place",
      },
      {
        property: "og:description",
        content:
          "Agentic, evidence-grounded satellite imagery analysis with confidence scoring and auditable traces.",
      },
    ],
  }),
  component: Home,
});
