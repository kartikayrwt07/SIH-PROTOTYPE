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
  register: (payload: {
    full_name: string;
    email: string;
    password: string;
    role?: UserRole;
    bureau_id?: string;
  }) => Promise<{ success: boolean; error?: { message: string } }>;
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
    if (!currentToken) {
      setCurrentUser(null);
      setPermissions([]);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const res = await api.getCurrentUser(currentToken);
      if (res.success && res.data) {
        setCurrentUser(res.data);
        setCurrentRole(res.data.role);
        localStorage.setItem("aicte_demo_role", res.data.role);
        setPermissions(res.data.permissions || []);
      } else {
        localStorage.removeItem("aicte_token");
        localStorage.removeItem("aicte_demo_role");
        setToken(null);
        setCurrentUser(null);
        setPermissions([]);
      }
    } catch (e) {
      console.error("Failed to load user profile", e);
      localStorage.removeItem("aicte_token");
      localStorage.removeItem("aicte_demo_role");
      setToken(null);
      setCurrentUser(null);
      setPermissions([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile(token);
  }, [token]);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    const res = await api.login({ email, password });
    if (res.success && res.data?.access_token) {
      const accessToken = res.data.access_token;
      try {
        const profileRes = await api.getCurrentUser(accessToken);
        if (profileRes.success && profileRes.data) {
          localStorage.setItem("aicte_token", accessToken);
          localStorage.setItem("aicte_demo_role", profileRes.data.role);
          setCurrentUser(profileRes.data);
          setCurrentRole(profileRes.data.role);
          setPermissions(profileRes.data.permissions || []);
          setToken(accessToken);
          setIsLoading(false);
          return { success: true };
        }
      } catch (err) {
        console.error("Failed loading user profile post-login", err);
      }
    }
    setIsLoading(false);
    return { success: false, error: res.error };
  };

  const register = async (payload: {
    full_name: string;
    email: string;
    password: string;
    role?: UserRole;
    bureau_id?: string;
  }) => {
    setIsLoading(true);
    const res = await api.register(payload);
    if (res.success && res.data?.access_token) {
      const accessToken = res.data.access_token;
      try {
        const profileRes = await api.getCurrentUser(accessToken);
        if (profileRes.success && profileRes.data) {
          localStorage.setItem("aicte_token", accessToken);
          localStorage.setItem("aicte_demo_role", profileRes.data.role);
          setCurrentUser(profileRes.data);
          setCurrentRole(profileRes.data.role);
          setPermissions(profileRes.data.permissions || []);
          setToken(accessToken);
          setIsLoading(false);
          return { success: true };
        }
      } catch (err) {
        console.error("Failed loading user profile post-register", err);
      }
    }
    setIsLoading(false);
    return { success: false, error: res.error };
  };

  const logout = () => {
    localStorage.removeItem("aicte_token");
    localStorage.removeItem("aicte_demo_role");
    sessionStorage.clear();
    setToken(null);
    setCurrentUser(null);
    setCurrentRole("SUPERVISOR");
    setPermissions([]);
  };

  const switchRole = async (newRole: UserRole) => {
    setIsLoading(true);
    try {
      const res = await api.switchDemoRole(newRole);
      if (res.success && res.data?.token) {
        const newToken = res.data.token;
        const profileRes = await api.getCurrentUser(newToken);
        if (profileRes.success && profileRes.data) {
          localStorage.setItem("aicte_token", newToken);
          localStorage.setItem("aicte_demo_role", profileRes.data.role);
          setCurrentUser(profileRes.data);
          setCurrentRole(profileRes.data.role);
          setPermissions(profileRes.data.permissions || []);
          setToken(newToken);
        }
      }
    } catch (err) {
      console.error("Role switch failed", err);
    } finally {
      setIsLoading(false);
    }
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
        register,
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
