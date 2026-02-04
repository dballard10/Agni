import React, { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { TopBar } from "@/widgets/TopBar";
import { ShellSidebar } from "@/widgets/ShellSidebar";
import { MainContentHeader } from "@/widgets/MainContentHeader";
import { TopNotificationHost } from "@/widgets/TopNotifications";
import type { PageId, EditorMode } from "@/app/shell/types";

interface AgniShellLayoutProps {
  children: React.ReactNode;
  activeTab: PageId;
  onTabChange: (tab: PageId) => void;
  // Navigation callbacks (passed from page components)
  filePath?: string;
  canGoBack?: boolean;
  canGoForward?: boolean;
  onGoBack?: () => void;
  onGoForward?: () => void;
  // Editor mode (passed from page components)
  editorMode?: EditorMode;
  onToggleEditorMode?: () => void;
  // Sidebar content (passed from page components)
  sidebarContent?: React.ReactNode;
  // Right panel content (passed from page components)
  rightPanelContent?: React.ReactNode;
  // Sidebar action callbacks
  onNewItem?: () => void;
  onOpenExplorer?: () => void;
  onOpenFileExplorerTab?: () => void;
  onFocusSearch?: () => void;
  onOpenDatePicker?: () => void;
}

export function AgniShellLayout({
  children,
  activeTab,
  onTabChange,
  filePath = "File/Path/...",
  canGoBack = false,
  canGoForward = false,
  onGoBack,
  onGoForward,
  editorMode = "preview",
  onToggleEditorMode,
  sidebarContent,
  rightPanelContent,
  onNewItem,
  onOpenExplorer,
  onOpenFileExplorerTab,
  onFocusSearch,
  onOpenDatePicker,
}: AgniShellLayoutProps) {
  const [leftPanelOpen, setLeftPanelOpen] = useState(true);
  const [rightPanelOpen, setRightPanelOpen] = useState(false);
  const [activeTabIndex, setActiveTabIndex] = useState(0);

  const handleToggleLeftPanel = useCallback(() => {
    setLeftPanelOpen((prev) => !prev);
  }, []);

  const handleToggleRightPanel = useCallback(() => {
    setRightPanelOpen((prev) => !prev);
  }, []);

  const handleOpenSettings = useCallback(() => {
    onTabChange("settings");
  }, [onTabChange]);

  const handlePageChange = useCallback(
    (page: PageId) => {
      onTabChange(page);
      setActiveTabIndex(0); // Reset tab index when changing pages
    },
    [onTabChange]
  );

  const handleTabIndexChange = useCallback((index: number) => {
    setActiveTabIndex(index);
  }, []);

  const handleGoBack = useCallback(() => {
    onGoBack?.();
  }, [onGoBack]);

  const handleGoForward = useCallback(() => {
    onGoForward?.();
  }, [onGoForward]);

  const handleToggleEditorMode = useCallback(() => {
    onToggleEditorMode?.();
  }, [onToggleEditorMode]);

  const handleOpenMenu = useCallback(() => {
    // Placeholder for menu functionality
  }, []);

  const handleNewItem = useCallback(() => {
    onNewItem?.();
  }, [onNewItem]);

  const handleOpenExplorer = useCallback(() => {
    onOpenExplorer?.();
  }, [onOpenExplorer]);

  const handleOpenFileExplorerTab = useCallback(() => {
    onOpenFileExplorerTab?.();
  }, [onOpenFileExplorerTab]);

  const handleFocusSearch = useCallback(() => {
    onFocusSearch?.();
  }, [onFocusSearch]);

  const handleOpenDatePicker = useCallback(() => {
    onOpenDatePicker?.();
  }, [onOpenDatePicker]);

  return (
    <div className="flex flex-col h-screen w-full bg-slate-950 text-slate-50 overflow-hidden">
      <TopNotificationHost />

      {/* Top Bar */}
      <TopBar
        currentPage={activeTab}
        activeTabIndex={activeTabIndex}
        leftPanelOpen={leftPanelOpen}
        rightPanelOpen={rightPanelOpen}
        onPageChange={handlePageChange}
        onTabChange={handleTabIndexChange}
        onToggleLeftPanel={handleToggleLeftPanel}
        onToggleRightPanel={handleToggleRightPanel}
        onOpenSettings={handleOpenSettings}
      />

      {/* Main layout: sidebar + content + optional right panel */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar */}
        <ShellSidebar
          isOpen={leftPanelOpen}
          currentPage={activeTab}
          onNewItem={handleNewItem}
          onOpenExplorer={handleOpenExplorer}
          onOpenFileExplorerTab={handleOpenFileExplorerTab}
          onFocusSearch={handleFocusSearch}
          onOpenDatePicker={handleOpenDatePicker}
        >
          {sidebarContent}
        </ShellSidebar>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Main Content Header */}
          <MainContentHeader
            filePath={filePath}
            editorMode={editorMode}
            canGoBack={canGoBack}
            canGoForward={canGoForward}
            onGoBack={handleGoBack}
            onGoForward={handleGoForward}
            onToggleEditorMode={handleToggleEditorMode}
            onOpenMenu={handleOpenMenu}
          />

          {/* Main Content Body */}
          <main className="flex-1 overflow-y-auto overflow-x-hidden">
            {children}
          </main>
        </div>

        {/* Right Side Panel */}
        <motion.aside
          initial={false}
          animate={{ width: rightPanelOpen ? 320 : 0, opacity: rightPanelOpen ? 1 : 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 200 }}
          className="flex flex-col h-full bg-slate-900 border-l border-slate-700 overflow-hidden flex-shrink-0"
        >
          <div className="flex-1 overflow-y-auto overflow-x-hidden p-3">
            {rightPanelContent ?? (
              <div className="text-slate-500 text-sm">
                RIGHT PANEL GOES HERE
              </div>
            )}
          </div>
        </motion.aside>
      </div>
    </div>
  );
}

export default AgniShellLayout;
