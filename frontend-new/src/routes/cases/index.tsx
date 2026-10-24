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
    <div className="py-10 px-6 lg:px-8 max-w-7xl mx-auto space-y-10">
      <CaseRegister initialBureauId={bureau_id} />
    </div>
  );
}
