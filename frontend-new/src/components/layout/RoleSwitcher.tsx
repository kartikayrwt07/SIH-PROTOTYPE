/**
 * Role Switcher — lets the evaluator switch between demo roles in one click.
 * Designed as a compact dropdown for the top header.
 */

import { useRole } from "@/contexts/RoleContext";
import type { UserRole } from "@/types/ui";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";

const ROLES: { value: UserRole; label: string; dot: string }[] = [
  { value: "ADMIN",      label: "Admin",      dot: "bg-purple-500" },
  { value: "SUPERVISOR", label: "Supervisor", dot: "bg-blue-500" },
  { value: "OFFICER",    label: "Officer",    dot: "bg-emerald-500" },
  { value: "AUDITOR",    label: "Auditor",    dot: "bg-amber-500" },
];

export function RoleSwitcher() {
  const { role, user, isLoading, changeRole } = useRole();
  const current = ROLES.find((r) => r.value === role) ?? ROLES[1];

  return (
    <div className="flex items-center gap-2.5">
      <span className="text-xs text-muted-foreground hidden sm:inline">Role:</span>
      <Select
        value={role}
        onValueChange={(v) => changeRole(v as UserRole)}
        disabled={isLoading}
      >
        <SelectTrigger className="h-8 w-auto gap-2 border-border/60 bg-background text-xs font-medium px-2.5 shadow-none hover:bg-muted/50 transition-colors">
          {isLoading ? (
            <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
          ) : (
            <span className="flex items-center gap-1.5">
              <span className={`h-1.5 w-1.5 rounded-full ${current.dot}`} />
              <span className="font-semibold text-foreground">{current.label}</span>
            </span>
          )}
        </SelectTrigger>
        <SelectContent align="end" className="text-xs">
          {ROLES.map((r) => (
            <SelectItem key={r.value} value={r.value} className="text-xs">
              <span className="flex items-center gap-2">
                <span className={`h-1.5 w-1.5 rounded-full ${r.dot}`} />
                <span className="font-medium">{r.label}</span>
                {r.value === "OFFICER" && (
                  <span className="text-[11px] text-muted-foreground">
                    (Approval Bureau)
                  </span>
                )}
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {user && (
        <span className="text-xs text-muted-foreground/80 hidden md:inline truncate max-w-[130px]">
          {user.full_name}
        </span>
      )}
    </div>
  );
}
