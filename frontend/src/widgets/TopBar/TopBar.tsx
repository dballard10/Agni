import { useState } from "react";
import {
  IconChevronLeft,
  IconChevronRight,
  IconLayoutSidebar,
  IconLayoutSidebarFilled,
  IconLayoutSidebarRightFilled,
  IconLayoutSidebarRight,
  IconSettings,
} from "@tabler/icons-react";
import { AgniMenuDropdown } from "./AgniMenuDropdown";
import { PageTabs } from "./PageTabs";
import type { PageId } from "@/app/shell/types";

interface TopBarProps {
  currentPage: PageId;
  activeTabIndex: number;
  canGoBack: boolean;
  canGoForward: boolean;
  leftPanelOpen: boolean;
  rightPanelOpen: boolean;
  onPageChange: (page: PageId) => void;
  onTabChange: (index: number) => void;
  onGoBack: () => void;
  onGoForward: () => void;
  onToggleLeftPanel: () => void;
  onToggleRightPanel: () => void;
  onOpenSettings: () => void;
}

export function TopBar({
  currentPage,
  activeTabIndex,
  canGoBack,
  canGoForward,
  leftPanelOpen,
  rightPanelOpen,
  onPageChange,
  onTabChange,
  onGoBack,
  onGoForward,
  onToggleLeftPanel,
  onToggleRightPanel,
  onOpenSettings,
}: TopBarProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const LeftPanelIcon = leftPanelOpen ? IconLayoutSidebarFilled : IconLayoutSidebar;
  const RightPanelIcon = rightPanelOpen ? IconLayoutSidebarRightFilled : IconLayoutSidebarRight;

  return (
    <div className="flex items-center h-12 px-3 bg-slate-900 border-b border-slate-700">
      {/* Left section: Logo/Menu + History */}
      <div className="flex items-center gap-1">
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
      </div>

      {/* Center section: Page tabs */}
      <div className="flex-1 flex justify-center">
        <PageTabs
          activeTabIndex={activeTabIndex}
          onTabChange={onTabChange}
        />
      </div>

      {/* Right section: Panel toggles and settings */}
      <div className="flex items-center gap-1">
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
        <button
          onClick={onOpenSettings}
          className="flex items-center justify-center w-8 h-8 rounded-md text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition-colors"
          aria-label="Open settings"
          title="Open settings"
        >
          <IconSettings className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
