import React, { createContext, useContext, useState, useEffect } from "react";
import { UserRole, UserSummary } from "../types";
import { api } from "../services/api";

interface AuthContextType {
  currentRole: UserRole;
  currentUser: UserSummary | null;
  permissions: string[];
  switchRole: (role: UserRole) => void;
  hasPermission: (permission: string) => boolean;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentRole, setCurrentRole] = useState<UserRole>(() => {
    return (localStorage.getItem("aicte_demo_role") as UserRole) || "SUPERVISOR";
  });
  const [currentUser, setCurrentUser] = useState<UserSummary | null>(null);
  const [permissions, setPermissions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchProfile = async (role: UserRole) => {
    setIsLoading(true);
    try {
      const res = await api.getCurrentUser(role);
      if (res.success && res.data) {
        setCurrentUser(res.data);
        setPermissions(res.data.permissions || []);
      }
    } catch (e) {
      console.error("Failed to load user profile", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile(currentRole);
  }, [currentRole]);

  const switchRole = (newRole: UserRole) => {
    localStorage.setItem("aicte_demo_role", newRole);
    setCurrentRole(newRole);
  };

  const hasPermission = (permission: string) => {
    return permissions.includes(permission) || currentRole === "ADMIN";
  };

  return (
    <AuthContext.Provider
      value={{
        currentRole,
        currentUser,
        permissions,
        switchRole,
        hasPermission,
        isLoading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
