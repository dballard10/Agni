import React, { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { TopBar, type PageTab, type TabGroup, type TabContextMenuCallbacks } from "@/widgets/TopBar";
import { ShellSidebar } from "@/widgets/ShellSidebar";
import { MainContentHeader, type HeaderMenuItem } from "@/widgets/MainContentHeader";
import { TopNotificationHost } from "@/widgets/TopNotifications";
import type { PageId, EditorMode } from "@/app/shell/types";
import type { SplitMode } from "@/pages/NotesPage";

type UtilityTabId = "goals" | "companions" | "settings";

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
  // Right panel toggle visibility
  showRightPanelToggle?: boolean;
  // Sidebar action callbacks
  onOpenFileExplorerTab?: () => void;
  onFocusSearch?: () => void;
  onOpenOverview?: () => void;
  // Utility tabs (Goals, Companions, Settings)
  onOpenUtilityTab?: (tab: UtilityTabId) => void;
  // Page tabs - single group mode (generic, used by Notes and Weekly)
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
  // Optional title shown in the main content header (left side)
  headerTitle?: string;
  // Menu items for the header three-dots dropdown
  headerMenuItems?: HeaderMenuItem[];
  // Split view mode
  splitMode?: SplitMode;
  secondaryFilePath?: string;
  // Split ratio for resizable panes (0-1)
  splitRatio?: number;
  // Tab context menu callbacks
  tabContextMenu?: TabContextMenuCallbacks;
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
  showRightPanelToggle = true,
  onOpenFileExplorerTab,
  onFocusSearch,
  onOpenOverview,
  onOpenUtilityTab,
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
  headerTitle,
  headerMenuItems,
  splitMode,
  secondaryFilePath,
  splitRatio,
  tabContextMenu,
}: AgniShellLayoutProps) {
  const [leftPanelOpen, setLeftPanelOpen] = useState(true);
  const [rightPanelOpen, setRightPanelOpen] = useState(false);
  const [activeTabIndex, setActiveTabIndex] = useState(0);
  const [sidebarWidth, setSidebarWidth] = useState(260);

  const handleToggleLeftPanel = useCallback(() => {
    setLeftPanelOpen((prev) => !prev);
  }, []);

  const handleToggleRightPanel = useCallback(() => {
    setRightPanelOpen((prev) => !prev);
  }, []);

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

  const handleOpenFileExplorerTab = useCallback(() => {
    onOpenFileExplorerTab?.();
  }, [onOpenFileExplorerTab]);

  const handleFocusSearch = useCallback(() => {
    onFocusSearch?.();
  }, [onFocusSearch]);

  const handleOpenOverview = useCallback(() => {
    onOpenOverview?.();
  }, [onOpenOverview]);

  // CSS variable for sidebar width alignment
  const effectiveSidebarWidth = leftPanelOpen ? sidebarWidth : 0;

  return (
    <div
      className="flex flex-col h-screen w-full bg-slate-950 text-slate-50 overflow-hidden"
      style={{ "--agni-left-sidebar-width": `${effectiveSidebarWidth}px` } as React.CSSProperties}
    >
      <TopNotificationHost />

      {/* Top Bar */}
      <TopBar
        currentPage={activeTab}
        activeTabIndex={activeTabIndex}
        canGoBack={canGoBack}
        canGoForward={canGoForward}
        leftPanelOpen={leftPanelOpen}
        rightPanelOpen={rightPanelOpen}
        showRightPanelToggle={showRightPanelToggle}
        onPageChange={handlePageChange}
        onTabChange={handleTabIndexChange}
        onGoBack={handleGoBack}
        onGoForward={handleGoForward}
        onToggleLeftPanel={handleToggleLeftPanel}
        onToggleRightPanel={handleToggleRightPanel}
        onOpenUtilityTab={onOpenUtilityTab}
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
          currentPage={activeTab}
          onOpenFileExplorerTab={handleOpenFileExplorerTab}
          onFocusSearch={handleFocusSearch}
          onOpenOverview={handleOpenOverview}
          onClose={() => setLeftPanelOpen(false)}
          onWidthChange={setSidebarWidth}
        >
          {sidebarContent}
        </ShellSidebar>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col overflow-hidden relative">
          {/* Main Content Header - hidden for notes page (EditorPane has its own) */}
          {activeTab !== "notes" && (
            <MainContentHeader
              filePath={filePath}
              editorMode={editorMode}
              onToggleEditorMode={handleToggleEditorMode}
              menuItems={headerMenuItems}
              title={headerTitle}
              splitMode={splitMode}
              secondaryFilePath={secondaryFilePath}
            />
          )}

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
