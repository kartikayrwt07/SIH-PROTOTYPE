import { createFileRoute } from "@tanstack/react-router";
import { MagicIntakeView } from "@/components/ingest/MagicIntakeView";

export const Route = createFileRoute("/magic-intake")({
  component: MagicIntakeView,
});
