import {
  IconChevronLeft,
  IconChevronRight,
  IconLayoutSidebar,
  IconLayoutSidebarFilled,
} from "@tabler/icons-react";
import { PageTabs, type PageTab, type TabGroup, type TabContextMenuCallbacks } from "./PageTabs";
import { WindowControls } from "./WindowControls";
import { usePlatform } from "@/shared/hooks/usePlatform";
import type { PageId } from "@/app/shell/types";

interface TopBarProps {
  currentPage: PageId;
  canGoBack: boolean;
  canGoForward: boolean;
  leftPanelOpen: boolean;
  onGoBack: () => void;
  onGoForward: () => void;
  onToggleLeftPanel: () => void;
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
  canGoBack,
  canGoForward,
  leftPanelOpen,
  onGoBack,
  onGoForward,
  onToggleLeftPanel,
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
  const { isDesktop, isMac } = usePlatform();

  const LeftPanelIcon = leftPanelOpen ? IconLayoutSidebarFilled : IconLayoutSidebar;

  // Determine if we're in multi-group mode
  const isMultiGroup = !!tabGroups && tabGroups.length > 0;

  // Traffic light padding on macOS desktop
  const trafficLightPadding = isDesktop && isMac ? 70 : 0;

  return (
    <div
      className="grid items-stretch h-10 bg-bg-topbar border-b border-border"
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
        <div className="flex items-center gap-2">
          <img
            src="/logos/agni-flame-logo.png"
            alt="Agni"
            className="w-5 h-5"
          />
        </div>
        <div className="flex items-center gap-0.5">
          <button
            onClick={onGoBack}
            disabled={!canGoBack}
            className={`flex items-center justify-center w-8 h-8 rounded-md transition-colors ${
              canGoBack
                ? "text-text-muted hover:bg-bg-hover hover:text-text-secondary"
                : "text-text-disabled cursor-not-allowed"
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
                ? "text-text-muted hover:bg-bg-hover hover:text-text-secondary"
                : "text-text-disabled cursor-not-allowed"
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
              ? "text-text-primary hover:bg-bg-hover"
              : "text-text-muted hover:bg-bg-hover hover:text-text-secondary"
          }`}
          aria-label={leftPanelOpen ? "Hide left panel" : "Show left panel"}
          title={leftPanelOpen ? "Hide left panel" : "Show left panel"}
        >
          <LeftPanelIcon className="w-5 h-5" />
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

      {/* Column 3: Right controls (window controls only) */}
      <div
        className="flex items-center gap-1 px-3"
        style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
      >
        {/* Windows/Linux window controls */}
        {isDesktop && !isMac && <WindowControls />}
      </div>
    </div>
  );
}
