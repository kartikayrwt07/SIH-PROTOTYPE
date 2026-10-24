import { createFileRoute } from "@tanstack/react-router";
import { CaseRegister } from "@/components/cases/CaseRegister";

interface CasesSearchParams {
  bureau_id?: string;
  preview?: string;
}

export const Route = createFileRoute("/cases/")({
  validateSearch: (search: Record<string, unknown>): CasesSearchParams => {
    return {
      bureau_id: typeof search.bureau_id === "string" ? search.bureau_id : undefined,
      preview: typeof search.preview === "string" ? search.preview : undefined,
    };
  },
  component: CasesRoute,
});

function CasesRoute() {
  const { bureau_id } = Route.useSearch();

  return (
    <div className="container max-w-7xl mx-auto py-6 px-4 space-y-4">
      <div className="space-y-1">
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
          Complaint Case Register
        </h1>
        <p className="text-xs text-muted-foreground">
          Central catalog of institutional grievances. Click any row to open quick preview and dossier actions.
        </p>
      </div>
      <CaseRegister initialBureauId={bureau_id} />
    </div>
  );
}
