import { createFileRoute } from "@tanstack/react-router";
import { SlaRadarView } from "@/components/sla/SlaRadarView";

export const Route = createFileRoute("/sla-radar")({
  component: SlaRadarView,
});
