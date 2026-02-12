import React, { useState, useCallback } from "react";
import { TopBar, type PageTab, type TabGroup, type TabContextMenuCallbacks } from "@/widgets/TopBar";
import { ShellSidebar } from "@/widgets/ShellSidebar";
import { TopNotificationHost } from "@/widgets/TopNotifications";

interface AgniShellLayoutProps {
  children: React.ReactNode;
  // Sidebar content (passed from page components)
  sidebarContent?: React.ReactNode;
  // Navigation callbacks
  canGoBack?: boolean;
  canGoForward?: boolean;
  onGoBack?: () => void;
  onGoForward?: () => void;
  // Sidebar action callbacks
  onOpenFileExplorerTab?: () => void;
  onFocusSearch?: () => void;
  // Page tabs - single group mode
  pageTabs?: PageTab[];
  activePageTabIndex?: number;
  onPageTabChange?: (index: number) => void;
  onPageTabClose?: (index: number) => void;
  onTabReorder?: (fromIndex: number, toIndex: number) => void;
  onAddTab?: () => void;
  // Page tabs - multi group mode (for split view)
  tabGroups?: TabGroup[];
  onGroupTabChange?: (groupIndex: number, tabIndex: number) => void;
  onGroupTabClose?: (groupIndex: number, tabIndex: number) => void;
  onTabMove?: (fromGroup: number, fromIndex: number, toGroup: number, toIndex: number) => void;
  onGroupAddTab?: (groupIndex: number) => void;
  // Split view mode
  splitRatio?: number;
  // Tab context menu callbacks
  tabContextMenu?: TabContextMenuCallbacks;
}

export function AgniShellLayout({
  children,
  sidebarContent,
  canGoBack = false,
  canGoForward = false,
  onGoBack,
  onGoForward,
  onOpenFileExplorerTab,
  onFocusSearch,
  pageTabs,
  activePageTabIndex,
  onPageTabChange,
  onPageTabClose,
  onTabReorder,
  onAddTab,
  tabGroups,
  onGroupTabChange,
  onGroupTabClose,
  onTabMove,
  onGroupAddTab,
  splitRatio,
  tabContextMenu,
}: AgniShellLayoutProps) {
  const [leftPanelOpen, setLeftPanelOpen] = useState(true);
  const [sidebarWidth, setSidebarWidth] = useState(260);

  const handleToggleLeftPanel = useCallback(() => {
    setLeftPanelOpen((prev) => !prev);
  }, []);

  const handleGoBack = useCallback(() => {
    onGoBack?.();
  }, [onGoBack]);

  const handleGoForward = useCallback(() => {
    onGoForward?.();
  }, [onGoForward]);

  const handleOpenFileExplorerTab = useCallback(() => {
    onOpenFileExplorerTab?.();
  }, [onOpenFileExplorerTab]);

  const handleFocusSearch = useCallback(() => {
    onFocusSearch?.();
  }, [onFocusSearch]);

  // CSS variable for sidebar width alignment
  const effectiveSidebarWidth = leftPanelOpen ? sidebarWidth : 0;

  return (
    <div
      className="flex flex-col h-screen w-full bg-bg-app text-text-primary overflow-hidden"
      style={{ "--agni-left-sidebar-width": `${effectiveSidebarWidth}px` } as React.CSSProperties}
    >
      <TopNotificationHost />

      {/* Top Bar */}
      <TopBar
        currentPage="notes"
        canGoBack={canGoBack}
        canGoForward={canGoForward}
        leftPanelOpen={leftPanelOpen}
        onGoBack={handleGoBack}
        onGoForward={handleGoForward}
        onToggleLeftPanel={handleToggleLeftPanel}
        pageTabs={pageTabs}
        activePageTabIndex={activePageTabIndex}
        onPageTabChange={onPageTabChange}
        onPageTabClose={onPageTabClose}
        onTabReorder={onTabReorder}
        onAddTab={onAddTab}
        tabGroups={tabGroups}
        onGroupTabChange={onGroupTabChange}
        onGroupTabClose={onGroupTabClose}
        onTabMove={onTabMove}
        onGroupAddTab={onGroupAddTab}
        splitRatio={splitRatio}
        tabContextMenu={tabContextMenu}
      />

      {/* Main layout: sidebar + content + optional right panel */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar */}
        <ShellSidebar
          isOpen={leftPanelOpen}
          currentPage="notes"
          onOpenFileExplorerTab={handleOpenFileExplorerTab}
          onFocusSearch={handleFocusSearch}
          onClose={() => setLeftPanelOpen(false)}
          onWidthChange={setSidebarWidth}
        >
          {sidebarContent}
        </ShellSidebar>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col overflow-hidden relative">
          {/* Main Content Body - EditorPane has its own header */}
          <main className="flex-1 overflow-y-auto overflow-x-hidden">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}

export default AgniShellLayout;
