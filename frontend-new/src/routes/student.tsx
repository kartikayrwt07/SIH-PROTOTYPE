import { createFileRoute } from "@tanstack/react-router";
import { StudentPortalView } from "@/components/student/StudentPortalView";

export const Route = createFileRoute("/student")({
  component: StudentPortalView,
});
