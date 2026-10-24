import { createFileRoute } from "@tanstack/react-router";
import { SmartTriageView } from "@/components/triage/SmartTriageView";

export const Route = createFileRoute("/ai-triage")({
  component: SmartTriageView,
});
