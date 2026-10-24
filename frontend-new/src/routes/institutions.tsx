import { createFileRoute } from "@tanstack/react-router";
import { InstitutionTrustLeaderboard } from "@/components/institutions/InstitutionTrustLeaderboard";

export const Route = createFileRoute("/institutions")({
  component: InstitutionTrustLeaderboard,
});
