import { createFileRoute } from "@tanstack/react-router";
import Imagery from "@/pages/Imagery";

export const Route = createFileRoute("/imagery")({
  head: () => ({
    meta: [
      { title: "Imagery validation — SatQuery AI" },
      {
        name: "description",
        content:
          "Every optical and radar scene is validated for format, projection, alignment, cloud, date spacing and coverage before analysis.",
      },
      { property: "og:title", content: "Imagery validation — SatQuery AI" },
      {
        property: "og:description",
        content:
          "Scenes that fail validation are excluded, with the reason shown.",
      },
    ],
  }),
  component: Imagery,
});
