import React from "react";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { RoleBanner } from "./RoleBanner";

interface LayoutProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  serviceStatus: string;
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({
  activeTab,
  onTabChange,
  serviceStatus,
  children,
}) => {
  return (
    <div className="app-layout">
      <Sidebar activeTab={activeTab} onTabChange={onTabChange} />
      <div className="main-wrapper">
        <Header serviceStatus={serviceStatus} />
        <RoleBanner />
        <main className="page-content">{children}</main>
      </div>
    </div>
  );
};
