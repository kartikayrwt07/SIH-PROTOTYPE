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

interface RoleOption {
  key: string;
  role: UserRole;
  bureauCode?: string;
  label: string;
  bureau: string;
}

const ROLE_OPTIONS: RoleOption[] = [
  { key: "ADMIN", role: "ADMIN", label: "Admin", bureau: "Central Administration" },
  { key: "SUPERVISOR", role: "SUPERVISOR", label: "Supervisor", bureau: "Grievance Oversight" },
  { key: "OFFICER_APPR", role: "OFFICER", bureauCode: "APPR", label: "Officer (Approval)", bureau: "Approval Bureau (APPR)" },
  { key: "OFFICER_FIN", role: "OFFICER", bureauCode: "FIN", label: "Officer (Finance)", bureau: "Finance & Fee Bureau (FIN)" },
  { key: "OFFICER_STU", role: "OFFICER", bureauCode: "STU", label: "Officer (Student Welfare)", bureau: "Student Welfare Cell (STU)" },
  { key: "OFFICER_FDC", role: "OFFICER", bureauCode: "FDC", label: "Officer (Faculty Grievance)", bureau: "Faculty Grievance Cell (FDC)" },
  { key: "AUDITOR", role: "AUDITOR", label: "Auditor", bureau: "Independent Compliance" },
];

export function RoleSwitcher() {
  const { role, user, isLoading, changeRole } = useRole();

  const currentKey =
    role === "OFFICER"
      ? (user?.bureau_code ? `OFFICER_${user.bureau_code}` : "OFFICER_APPR")
      : role;

  const current = ROLE_OPTIONS.find((r) => r.key === currentKey) ?? ROLE_OPTIONS[0]!;

  const bureauDisplay =
    role === "OFFICER" && user?.bureau_name
      ? user.bureau_name
      : current.bureau;

  const handleRoleChange = (key: string) => {
    const selected = ROLE_OPTIONS.find((r) => r.key === key);
    if (!selected) return;
    changeRole(selected.role, selected.bureauCode);
  };

  return (
    <div className="flex items-center gap-1.5 sm:gap-3">
      {/* Demo Mode Badge */}
      <span className="hidden md:inline-flex text-[10px] sm:text-[11px] px-2 py-0.5 rounded border border-rule bg-page text-text-muted select-none">
        Demo mode
      </span>

      <div className="flex items-center gap-1.5 sm:gap-2 text-xs">
        <span className="text-text-secondary hidden sm:inline">Viewing as</span>

        <Select
          value={currentKey}
          onValueChange={handleRoleChange}
          disabled={isLoading}
        >
          <SelectTrigger className="h-8 w-auto max-w-[125px] sm:max-w-none gap-1 sm:gap-2 border-rule bg-surface text-xs font-medium px-2 sm:px-2.5 shadow-none hover:bg-page transition-none">
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
            {ROLE_OPTIONS.map((r) => (
              <SelectItem key={r.key} value={r.key} className="text-xs py-2">
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
