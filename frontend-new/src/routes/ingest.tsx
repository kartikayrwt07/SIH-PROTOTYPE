import { createFileRoute } from "@tanstack/react-router";
import { CsvIngestView } from "@/components/ingest/CsvIngestView";

export const Route = createFileRoute("/ingest")({
  component: CsvIngestView,
});
