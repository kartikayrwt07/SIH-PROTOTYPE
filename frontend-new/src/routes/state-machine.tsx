import { createFileRoute } from "@tanstack/react-router";
import { StateMachineView } from "@/components/statemachine/StateMachineView";

export const Route = createFileRoute("/state-machine")({
  component: StateMachineView,
});
