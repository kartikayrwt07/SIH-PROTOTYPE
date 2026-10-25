/**
 * Role context — tracks the current demo user role across the app.
 * Stored in React state (in-memory, resets on page refresh intentionally).
 */

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import type { CurrentUser, UserRole } from "@/types/ui";
import { switchRole, setMockRole } from "@/api/index";

interface RoleContextValue {
  role: UserRole;
  user: CurrentUser | null;
  isLoading: boolean;
  /** Switch to a different demo role. Optionally target a specific bureau by code or ID. */
  changeRole: (role: UserRole, bureauCodeOrId?: string) => Promise<void>;
  /** True when running with real backend (VITE_USE_MOCKS=false). */
  useMocks: boolean;
}

const RoleContext = createContext<RoleContextValue | null>(null);

const DEFAULT_ROLE: UserRole = "SUPERVISOR";

const DEFAULT_USER: CurrentUser = {
  id: "user-supervisor",
  email: "supervisor@aicte-demo.gov.in",
  full_name: "Dr. Ramesh Chandra",
  role: DEFAULT_ROLE,
  bureau_id: null,
  bureau_name: null,
  bureau_code: null,
  permissions: [
    "cases:read:all", "cases:assign", "cases:notes:create",
    "cases:notes:read:confidential", "cases:export", "dashboard:read:all", "audit:read:all",
  ],
};

export function RoleProvider({ children }: { children: ReactNode }) {
  const [role, setRole] = useState<UserRole>(DEFAULT_ROLE);
  const [user, setUser] = useState<CurrentUser | null>(DEFAULT_USER);
  const [isLoading, setIsLoading] = useState(false);

  const useMocks =
    ((import.meta.env as Record<string, string | undefined>)["VITE_USE_MOCKS"])?.toLowerCase() !== "false";

  const changeRole = useCallback(async (newRole: UserRole, bureauCodeOrId?: string) => {
    setIsLoading(true);
    try {
      const newUser = await switchRole(newRole, bureauCodeOrId);
      setRole(newUser.role);
      setUser(newUser);
      // Keep mock API layer in sync
      if (useMocks) setMockRole(newUser.role, newUser.bureau_id);
    } catch (err) {
      console.error("Failed to switch role:", err);
    } finally {
      setIsLoading(false);
    }
  }, [useMocks]);

  return (
    <RoleContext.Provider value={{ role, user, isLoading, changeRole, useMocks }}>
      {children}
    </RoleContext.Provider>
  );
}

export function useRole(): RoleContextValue {
  const ctx = useContext(RoleContext);
  if (!ctx) throw new Error("useRole must be used inside RoleProvider");
  return ctx;
}

/** True if current role has a given permission string. */
export function useHasPermission(permission: string): boolean {
  const { user } = useRole();
  return user?.permissions.includes(permission) ?? false;
}
