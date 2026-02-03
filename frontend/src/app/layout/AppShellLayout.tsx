import React, { useState } from "react";
import { LeftSidebar } from "@/widgets/SidePanel";
import { TopNotificationHost } from "@/widgets/TopNotifications";

interface AppShellLayoutProps {
  children: React.ReactNode;
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export function AppShellLayout({
  children,
  activeTab,
  onTabChange,
}: AppShellLayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  return (
    <div
      className="flex h-screen w-full bg-slate-950 text-slate-50 overflow-hidden app-shell-root"
      style={
        {
          "--app-left-sidebar-width": isSidebarOpen ? "260px" : "60px",
          transition: "--app-left-sidebar-width 0.35s ease",
        } as React.CSSProperties
      }
    >
      <TopNotificationHost />
      {/* Left Sidebar */}
      <LeftSidebar
        isOpen={isSidebarOpen}
        onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
        activeTab={activeTab}
        onTabChange={onTabChange}
      />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-full overflow-hidden relative pl-[60px] md:pl-0">
        {/* We wrap children in a scrollable container */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden">
          {children}
        </div>
      </main>
    </div>
  );
}

export default AppShellLayout;

