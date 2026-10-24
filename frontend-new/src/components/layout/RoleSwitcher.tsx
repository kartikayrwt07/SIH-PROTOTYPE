/**
 * Role Switcher for the Top Bar.
 * Displays "Viewing as", user name, role, bureau, and "Demo mode" label.
 */

import { useRole } from "@/contexts/RoleContext";
import type { UserRole } from "@/types/ui";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";

const ROLES: { value: UserRole; label: string; bureau?: string }[] = [
  { value: "ADMIN",      label: "Admin",      bureau: "Central Administration" },
  { value: "SUPERVISOR", label: "Supervisor", bureau: "Grievance Oversight" },
  { value: "OFFICER",    label: "Officer",    bureau: "Approval Bureau" },
  { value: "AUDITOR",    label: "Auditor",    bureau: "Independent Compliance" },
];

export function RoleSwitcher() {
  const { role, user, isLoading, changeRole } = useRole();
  const current = ROLES.find((r) => r.value === role) ?? ROLES[0]!;

  const bureauDisplay =
    role === "OFFICER" && user?.bureau_name
      ? user.bureau_name
      : current.bureau;

  return (
    <div className="flex items-center gap-3">
      {/* Demo Mode Badge */}
      <span className="text-[11px] px-2 py-0.5 rounded border border-rule bg-page text-text-muted select-none">
        Demo mode
      </span>

      <div className="flex items-center gap-2 text-xs">
        <span className="text-text-secondary hidden sm:inline">Viewing as</span>

        <Select
          value={role}
          onValueChange={(v) => changeRole(v as UserRole)}
          disabled={isLoading}
        >
          <SelectTrigger className="h-8 w-auto gap-2 border-rule bg-surface text-xs font-medium px-2.5 shadow-none hover:bg-page transition-none">
            {isLoading ? (
              <Loader2 className="h-3 w-3 animate-spin text-text-muted" />
            ) : (
              <div className="flex items-center gap-1.5 text-left">
                <span className="font-semibold text-ink">{current.label}</span>
                {user && (
                  <span className="text-text-secondary hidden md:inline">
                    · {user.full_name}
                  </span>
                )}
                {bureauDisplay && (
                  <span className="text-text-muted hidden lg:inline">
                    ({bureauDisplay})
                  </span>
                )}
              </div>
            )}
          </SelectTrigger>
          <SelectContent align="end" className="text-xs bg-surface border-rule shadow-md">
            {ROLES.map((r) => (
              <SelectItem key={r.value} value={r.value} className="text-xs py-2">
                <div className="flex flex-col">
                  <span className="font-semibold text-ink">{r.label}</span>
                  <span className="text-[11px] text-text-secondary">{r.bureau}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
