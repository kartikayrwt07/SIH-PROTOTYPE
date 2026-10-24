import React from "react";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { RoleBanner } from "./RoleBanner";
import { Footer } from "./Footer";

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
      <div className="main-wrapper" style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
        <Header serviceStatus={serviceStatus} />
        <RoleBanner />
        <main className="page-content" style={{ flex: 1 }}>{children}</main>
        <Footer systemStatus={serviceStatus} />
      </div>
    </div>
  );
};
