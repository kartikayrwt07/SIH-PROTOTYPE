import React from "react";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { UserRole } from "../../types";

interface LayoutProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  currentRole: UserRole;
  onRoleChange: (role: UserRole) => void;
  serviceStatus: string;
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({
  activeTab,
  onTabChange,
  currentRole,
  onRoleChange,
  serviceStatus,
  children,
}) => {
  return (
    <div className="app-layout">
      <Sidebar activeTab={activeTab} onTabChange={onTabChange} />
      <div className="main-wrapper">
        <Header
          currentRole={currentRole}
          onRoleChange={onRoleChange}
          serviceStatus={serviceStatus}
        />
        <main className="page-content">{children}</main>
      </div>
    </div>
  );
};
