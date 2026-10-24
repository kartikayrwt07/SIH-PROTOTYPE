import { createFileRoute } from "@tanstack/react-router";
import { MasterTicketHub } from "@/components/master-tickets/MasterTicketHub";

export const Route = createFileRoute("/master-tickets")({
  component: MasterTicketHub,
});
