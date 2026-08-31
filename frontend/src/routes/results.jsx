import { createFileRoute } from "@tanstack/react-router";
import Results from "@/pages/Results";

export const Route = createFileRoute("/results")({
  head: () => ({
    meta: [
      { title: "Answer and evidence — SatQuery AI" },
      {
        name: "description",
        content:
          "A natural-language answer with the evidence drawn on the map, a calibrated confidence score, the analysis trace, and PDF or GeoJSON export.",
      },
      { property: "og:title", content: "Answer and evidence — SatQuery AI" },
      {
        property: "og:description",
        content:
          "Evidence-grounded, confidence-scored satellite imagery answers you can audit and export.",
      },
    ],
  }),
  component: Results,
});
