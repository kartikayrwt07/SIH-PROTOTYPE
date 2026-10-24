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

const ROLES: { value: UserRole; label: string; badge: string }[] = [
  { value: "ADMIN",      label: "Admin",      badge: "bg-purple-100 text-purple-800 border-purple-200" },
  { value: "SUPERVISOR", label: "Supervisor", badge: "bg-blue-100 text-blue-800 border-blue-200" },
  { value: "OFFICER",    label: "Officer",    badge: "bg-green-100 text-green-800 border-green-200" },
  { value: "AUDITOR",    label: "Auditor",    badge: "bg-amber-100 text-amber-800 border-amber-200" },
];

export function RoleSwitcher() {
  const { role, user, isLoading, changeRole } = useRole();
  const current = ROLES.find((r) => r.value === role) ?? ROLES[1];

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-muted-foreground hidden sm:block">Viewing as</span>
      <Select
        value={role}
        onValueChange={(v) => changeRole(v as UserRole)}
        disabled={isLoading}
      >
        <SelectTrigger className="h-8 w-auto gap-1.5 border-border text-xs font-medium px-2">
          {isLoading ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <Badge
              variant="outline"
              className={`text-[10px] font-semibold px-1.5 py-0 h-5 ${current.badge}`}
            >
              {current.label}
            </Badge>
          )}
        </SelectTrigger>
        <SelectContent align="end">
          {ROLES.map((r) => (
            <SelectItem key={r.value} value={r.value} className="text-xs">
              <span className="flex items-center gap-2">
                <Badge
                  variant="outline"
                  className={`text-[10px] font-semibold px-1.5 py-0 h-5 ${r.badge}`}
                >
                  {r.label}
                </Badge>
                <span className="text-muted-foreground">
                  {r.value === "OFFICER" ? "(Approval Bureau)" : ""}
                </span>
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {user && (
        <span className="text-xs text-muted-foreground hidden md:block truncate max-w-[140px]">
          {user.full_name}
        </span>
      )}
    </div>
  );
}
