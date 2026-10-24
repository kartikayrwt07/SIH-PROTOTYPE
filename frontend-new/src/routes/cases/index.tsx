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
    <div className="container max-w-7xl mx-auto py-6 px-6 space-y-5">
      <div className="space-y-0.5">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          Case Register
        </h1>
        <p className="text-xs text-muted-foreground">
          Central repository of recorded grievances and institutional complaints.
        </p>
      </div>
      <CaseRegister initialBureauId={bureau_id} />
    </div>
  );
}
