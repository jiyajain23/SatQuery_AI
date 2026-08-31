import { createFileRoute } from "@tanstack/react-router";
import AreaSelection from "@/pages/AreaSelection";

export const Route = createFileRoute("/area")({
  head: () => ({
    meta: [
      { title: "Choose an area — SatQuery AI" },
      {
        name: "description",
        content:
          "Search a place, draw a boundary or upload one, then pick what you want to know about it.",
      },
      { property: "og:title", content: "Choose an area — SatQuery AI" },
      {
        property: "og:description",
        content:
          "Set the area of interest for a SatQuery satellite-imagery analysis.",
      },
    ],
  }),
  component: AreaSelection,
});
