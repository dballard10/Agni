import { useState } from "react";
import {
  IconChevronLeft,
  IconChevronRight,
  IconLayoutSidebar,
  IconLayoutSidebarFilled,
  IconSettings,
} from "@tabler/icons-react";
import { AgniMenuDropdown } from "./AgniMenuDropdown";
import { PageTabs, type PageTab, type TabGroup, type TabContextMenuCallbacks } from "./PageTabs";
import { WindowControls } from "./WindowControls";
import { usePlatform } from "@/shared/hooks/usePlatform";
import type { PageId } from "@/app/shell/types";

type UtilityTabId = "goals" | "companions" | "settings";

interface TopBarProps {
  currentPage: PageId;
  activeTabIndex: number;
  canGoBack: boolean;
  canGoForward: boolean;
  leftPanelOpen: boolean;
  rightPanelOpen: boolean;
  showRightPanelToggle?: boolean;
  onPageChange: (page: PageId) => void;
  onTabChange: (index: number) => void;
  onGoBack: () => void;
  onGoForward: () => void;
  onToggleLeftPanel: () => void;
  onToggleRightPanel: () => void;
  onOpenUtilityTab?: (tab: UtilityTabId) => void;
  // Single-group mode (default)
  pageTabs?: PageTab[];
  activePageTabIndex?: number;
  onPageTabChange?: (index: number) => void;
  onPageTabClose?: (index: number) => void;
  onTabReorder?: (fromIndex: number, toIndex: number) => void;
  onAddTab?: () => void;
  // Multi-group mode (for split view)
  tabGroups?: TabGroup[];
  onGroupTabChange?: (groupIndex: number, tabIndex: number) => void;
  onGroupTabClose?: (groupIndex: number, tabIndex: number) => void;
  onTabMove?: (fromGroup: number, fromIndex: number, toGroup: number, toIndex: number) => void;
  onGroupAddTab?: (groupIndex: number) => void;
  // Split ratio for resizable panes (0-1)
  splitRatio?: number;
  // Tab context menu callbacks
  tabContextMenu?: TabContextMenuCallbacks;
}

export function TopBar({
  currentPage,
  canGoBack,
  canGoForward,
  leftPanelOpen,
  onPageChange,
  onGoBack,
  onGoForward,
  onToggleLeftPanel,
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
  splitRatio,
  tabContextMenu,
}: TopBarProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { isDesktop, isMac } = usePlatform();

  const LeftPanelIcon = leftPanelOpen ? IconLayoutSidebarFilled : IconLayoutSidebar;

  // Determine if we're in multi-group mode
  const isMultiGroup = !!tabGroups && tabGroups.length > 0;

  // Traffic light padding on macOS desktop
  const trafficLightPadding = isDesktop && isMac ? 70 : 0;

  return (
    <div
      className="grid items-stretch h-10 bg-slate-900 border-b border-slate-700"
      style={{
        gridTemplateColumns: leftPanelOpen
          ? `calc(var(--agni-left-sidebar-width, 260px) + ${trafficLightPadding}px) 1fr auto`
          : "auto 1fr auto",
        WebkitAppRegion: isDesktop ? 'drag' : undefined,
      } as React.CSSProperties}
    >
      {/* Column 1: Left controls (menu + back/forward) - width matches sidebar */}
      <div
        className="flex items-center gap-1 px-3"
        style={{
          paddingLeft: trafficLightPadding || 12,
          WebkitAppRegion: 'no-drag',
        } as React.CSSProperties}
      >
        <div className="relative flex items-center">
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="flex items-center justify-center w-8 h-8 rounded-md hover:bg-slate-800 transition-colors"
            aria-label="Open Agni menu"
            title="Open Agni menu"
          >
            <img
              src="/logos/agni-flame-logo.png"
              alt="Agni"
              className="w-5 h-5"
            />
          </button>
          <AgniMenuDropdown
            isOpen={isMenuOpen}
            onClose={() => setIsMenuOpen(false)}
            onSelectPage={onPageChange}
            currentPage={currentPage}
          />
        </div>
        <div className="flex items-center gap-0.5">
          <button
            onClick={onGoBack}
            disabled={!canGoBack}
            className={`flex items-center justify-center w-8 h-8 rounded-md transition-colors ${
              canGoBack
                ? "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
                : "text-slate-600 cursor-not-allowed"
            }`}
            aria-label="Go back"
            title="Go back"
          >
            <IconChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={onGoForward}
            disabled={!canGoForward}
            className={`flex items-center justify-center w-8 h-8 rounded-md transition-colors ${
              canGoForward
                ? "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
                : "text-slate-600 cursor-not-allowed"
            }`}
            aria-label="Go forward"
            title="Go forward"
          >
            <IconChevronRight className="w-5 h-5" />
          </button>
        </div>
        <button
          onClick={onToggleLeftPanel}
          className={`flex items-center justify-center w-8 h-8 rounded-md transition-colors ${
            leftPanelOpen
              ? "text-slate-100 hover:bg-slate-800"
              : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
          }`}
          aria-label={leftPanelOpen ? "Hide left panel" : "Show left panel"}
          title={leftPanelOpen ? "Hide left panel" : "Show left panel"}
        >
          <LeftPanelIcon className="w-5 h-5" />
        </button>
        <button
          onClick={() => onOpenUtilityTab?.("settings")}
          className="flex items-center justify-center w-8 h-8 rounded-md text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition-colors"
          aria-label="Open settings"
          title="Open settings"
        >
          <IconSettings className="w-5 h-5" />
        </button>
      </div>

      {/* Column 2: Tab strip - starts at sidebar boundary, aligned to bottom */}
      <div className="flex items-end overflow-hidden ml-2 h-full relative">
        {isMultiGroup && onGroupTabChange ? (
          <PageTabs
            groups={tabGroups}
            onGroupTabChange={onGroupTabChange}
            onGroupTabClose={onGroupTabClose}
            onTabMove={onTabMove}
            onGroupAddTab={onGroupAddTab}
            splitRatio={splitRatio}
            tabContextMenu={tabContextMenu}
          />
        ) : pageTabs && pageTabs.length > 0 && onPageTabChange ? (
          <PageTabs
            tabs={pageTabs}
            activeIndex={activePageTabIndex ?? 0}
            onTabChange={onPageTabChange}
            onTabClose={onPageTabClose}
            onTabReorder={onTabReorder}
            onAddTab={onAddTab}
            tabContextMenu={tabContextMenu}
          />
        ) : null}
      </div>

      {/* Column 3: Right controls (window controls only - panel toggles moved to left) */}
      <div
        className="flex items-center gap-1 px-3"
        style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
      >
        {/* Hidden for now - may use in future
        {showRightPanelToggle && (
          <button
            onClick={onToggleRightPanel}
            className={`flex items-center justify-center w-8 h-8 rounded-md transition-colors ${
              rightPanelOpen
                ? "text-slate-100 hover:bg-slate-800"
                : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
            }`}
            aria-label={rightPanelOpen ? "Hide right panel" : "Show right panel"}
            title={rightPanelOpen ? "Hide right panel" : "Show right panel"}
          >
            <RightPanelIcon className="w-5 h-5" />
          </button>
        )}
        <div className="relative flex items-center">
          <button
            onClick={() => setIsLibraryOpen(!isLibraryOpen)}
            className={`flex items-center justify-center w-8 h-8 rounded-md transition-colors ${
              hasUtilityTabOpen
                ? "text-slate-100 hover:bg-slate-800"
                : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
            }`}
            aria-label="Open library"
            title="Library (Goals & Companions)"
          >
            <IconBook2 className="w-5 h-5" />
          </button>
          <LibraryMenuDropdown
            isOpen={isLibraryOpen}
            onClose={() => setIsLibraryOpen(false)}
            onSelectUtilityTab={(tab) => {
              onOpenUtilityTab?.(tab);
              setIsLibraryOpen(false);
            }}
          />
        </div>
        */}

        {/* Windows/Linux window controls */}
        {isDesktop && !isMac && <WindowControls />}
      </div>
    </div>
  );
}
