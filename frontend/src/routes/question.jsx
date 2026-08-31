import { createFileRoute } from "@tanstack/react-router";
import Question from "@/pages/Question";

export const Route = createFileRoute("/question")({
  head: () => ({
    meta: [
      { title: "Ask a question — SatQuery AI" },
      {
        name: "description",
        content:
          "Write your question in plain language. SatQuery interprets it into a structured task plan — no model or parameter choices.",
      },
      { property: "og:title", content: "Ask a question — SatQuery AI" },
      {
        property: "og:description",
        content:
          "Plain-language querying of satellite imagery, interpreted into a structured task plan.",
      },
    ],
  }),
  component: Question,
});
