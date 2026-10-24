import { createFileRoute } from "@tanstack/react-router";
import { CaseDossierView } from "@/components/dossier/CaseDossierView";

export const Route = createFileRoute("/cases/$id")({
  component: CaseDossierRoute,
});

function CaseDossierRoute() {
  const { id } = Route.useParams();
  return <CaseDossierView caseRef={id} />;
}
