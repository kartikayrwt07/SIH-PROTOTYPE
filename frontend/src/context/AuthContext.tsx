import React, { createContext, useContext, useState, useEffect } from "react";
import { UserRole, UserSummary } from "../types";
import { api } from "../services/api";

interface AuthContextType {
  currentRole: UserRole;
  currentUser: UserSummary | null;
  permissions: string[];
  token: string | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: { message: string } }>;
  logout: () => void;
  switchRole: (role: UserRole) => void;
  hasPermission: (permission: string) => boolean;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem("aicte_token"));
  const [currentRole, setCurrentRole] = useState<UserRole>(() => {
    return (localStorage.getItem("aicte_demo_role") as UserRole) || "SUPERVISOR";
  });
  const [currentUser, setCurrentUser] = useState<UserSummary | null>(null);
  const [permissions, setPermissions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchProfile = async (currentToken: string | null) => {
    setIsLoading(true);
    try {
      if (!currentToken) {
        setCurrentUser(null);
        setPermissions([]);
        setIsLoading(false);
        return;
      }
      const res = await api.getCurrentUser();
      if (res.success && res.data) {
        setCurrentUser(res.data);
        setCurrentRole(res.data.role);
        localStorage.setItem("aicte_demo_role", res.data.role);
        setPermissions(res.data.permissions || []);
      } else {
        // Token expired or invalid
        localStorage.removeItem("aicte_token");
        setToken(null);
        setCurrentUser(null);
      }
    } catch (e) {
      console.error("Failed to load user profile", e);
      localStorage.removeItem("aicte_token");
      setToken(null);
      setCurrentUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile(token);
  }, [token]);

  const login = async (email: string, password: string) => {
    const res = await api.login({ email, password });
    if (res.success && res.data?.access_token) {
      const accessToken = res.data.access_token;
      localStorage.setItem("aicte_token", accessToken);
      setToken(accessToken);

      // Fetch fresh profile with new token
      try {
        const profileRes = await api.getCurrentUser();
        if (profileRes.success && profileRes.data) {
          setCurrentUser(profileRes.data);
          setCurrentRole(profileRes.data.role);
          setPermissions(profileRes.data.permissions || []);
        }
      } catch (err) {
        console.error("Failed loading user profile post-login", err);
      }
      return { success: true };
    }
    return { success: false, error: res.error };
  };

  const logout = () => {
    localStorage.removeItem("aicte_token");
    setToken(null);
    setCurrentUser(null);
    setPermissions([]);
  };

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
        token,
        isAuthenticated: !!token && !!currentUser,
        login,
        logout,
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
