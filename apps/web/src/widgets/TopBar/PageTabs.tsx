import { IconX, IconLayoutColumns, IconLayoutRows, IconLink, IconCopy, IconPencil, IconTrash } from "@tabler/icons-react";
import { useRef, useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { useAnchoredMenu } from "../../shared/hooks/useAnchoredMenu";

export interface PageTab {
  id: string;
  title: string;
  variant?: "base" | "utility" | "root";
  closable?: boolean;
}

export interface TabGroup {
  tabs: PageTab[];
  activeIndex: number;
}

interface DragState {
  groupIndex: number;
  tabIndex: number;
}

export interface TabContextMenuCallbacks {
  onSplitHorizontal?: (tabId: string) => void;
  onSplitVertical?: (tabId: string) => void;
  onCopyPath?: (tabId: string) => void;
  onCopyFile?: (tabId: string) => void;
  onRename?: (tabId: string) => void;
  onDelete?: (tabId: string) => void;
}

interface TabMenuState {
  tabId: string;
  isClosable: boolean;
}

// Single-group mode (backward compatible)
interface SingleGroupProps {
  tabs: PageTab[];
  activeIndex: number;
  onTabChange: (index: number) => void;
  onTabClose?: (index: number) => void;
  tabContextMenu?: TabContextMenuCallbacks;
  groups?: never;
  onGroupTabChange?: never;
  onGroupTabClose?: never;
  onTabMove?: never;
}

// Multi-group mode (for split view)
interface MultiGroupProps {
  groups: TabGroup[];
  onGroupTabChange: (groupIndex: number, tabIndex: number) => void;
  onGroupTabClose?: (groupIndex: number, tabIndex: number) => void;
  onTabMove?: (fromGroup: number, fromIndex: number, toGroup: number, toIndex: number) => void;
  // Split ratio for proportional group widths (0-1)
  splitRatio?: number;
  tabContextMenu?: TabContextMenuCallbacks;
  tabs?: never;
  activeIndex?: never;
  onTabChange?: never;
  onTabClose?: never;
}

type PageTabsProps = SingleGroupProps | MultiGroupProps;

const MIN_TAB_WIDTH = 24;
const MAX_TAB_WIDTH = 144;
const GROUP_DIVIDER_WIDTH = 24;

// Style variants for different tab types
function getTabStyles(variant: PageTab["variant"], isActive: boolean): string {
  const baseHeight = "h-[calc(100%-8px)]";

  if (variant === "utility") {
    if (isActive) {
      return `${baseHeight} bg-indigo-900/60 text-indigo-100 border border-indigo-500 border-b-transparent rounded-t-md z-10`;
    }
    return `${baseHeight} text-indigo-300 hover:text-indigo-100 hover:bg-indigo-900/40 rounded-t-md`;
  }

  if (variant === "root") {
    if (isActive) {
      return `${baseHeight} bg-slate-800/90 text-slate-100 border border-slate-500 border-b-transparent rounded-t-md z-10`;
    }
    return `${baseHeight} text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 rounded-t-md`;
  }

  // Default base tabs
  if (isActive) {
    return `${baseHeight} bg-slate-800/90 text-slate-100 border border-slate-500 border-b-transparent rounded-t-md z-10`;
  }
  return `${baseHeight} text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 rounded-t-md`;
}

export function PageTabs(props: PageTabsProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [tabWidth, setTabWidth] = useState(MAX_TAB_WIDTH);
  const [dragState, setDragState] = useState<DragState | null>(null);
  const [dropTarget, setDropTarget] = useState<{ groupIndex: number; tabIndex: number } | null>(null);

  // Context menu state
  const [menuState, setMenuState] = useState<TabMenuState | null>(null);
  const anchorRef = useRef<HTMLButtonElement | null>(null);

  const { isOpen, position, openAtPosition, close } = useAnchoredMenu({
    resolveAnchor: () => anchorRef.current,
    menuWidth: 180,
  });

  const handleContextMenu = useCallback((
    e: React.MouseEvent,
    tabId: string,
    isClosable: boolean
  ) => {
    e.preventDefault();
    e.stopPropagation();
    setMenuState({ tabId, isClosable });
    openAtPosition(e.clientX, e.clientY);
  }, [openAtPosition]);

  const handleCloseMenu = useCallback(() => {
    close();
    setMenuState(null);
  }, [close]);

  // Close menu on Escape key
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        handleCloseMenu();
      }
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [handleCloseMenu, isOpen]);

  // Normalize to multi-group format
  const groups: TabGroup[] = props.groups ?? [{ tabs: props.tabs!, activeIndex: props.activeIndex! }];
  const isMultiGroup = !!props.groups;

  const handleTabChange = useCallback((groupIndex: number, tabIndex: number) => {
    if (isMultiGroup) {
      props.onGroupTabChange!(groupIndex, tabIndex);
    } else {
      props.onTabChange!(tabIndex);
    }
  }, [isMultiGroup, props]);

  const handleTabClose = useCallback((groupIndex: number, tabIndex: number) => {
    if (isMultiGroup) {
      props.onGroupTabClose?.(groupIndex, tabIndex);
    } else {
      props.onTabClose?.(tabIndex);
    }
  }, [isMultiGroup, props]);

  const handleTabMove = useCallback((fromGroup: number, fromIndex: number, toGroup: number, toIndex: number) => {
    if (isMultiGroup) {
      props.onTabMove?.(fromGroup, fromIndex, toGroup, toIndex);
    }
  }, [isMultiGroup, props]);

  // Calculate total tabs for width calculation
  const totalTabs = groups.reduce((sum, g) => sum + g.tabs.length, 0);

  // Measure available width and compute per-tab width
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      const availableWidth = entry.contentRect.width;
      if (totalTabs === 0) return;

      // Account for group dividers
      const dividerSpace = isMultiGroup && groups.length > 1 ? GROUP_DIVIDER_WIDTH * (groups.length - 1) : 0;
      const tabSpace = availableWidth - dividerSpace;
      const perTab = Math.floor(tabSpace / totalTabs);
      const clamped = Math.max(MIN_TAB_WIDTH, Math.min(MAX_TAB_WIDTH, perTab));
      setTabWidth(clamped);
    });

    observer.observe(container);
    return () => observer.disconnect();
  }, [totalTabs, isMultiGroup, groups.length]);

  if (totalTabs === 0) return null;

  // Drag handlers
  const handleDragStart = (e: React.DragEvent, groupIndex: number, tabIndex: number) => {
    setDragState({ groupIndex, tabIndex });
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", `${groupIndex}:${tabIndex}`);
  };

  const handleDragOver = (e: React.DragEvent, groupIndex: number, tabIndex: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDropTarget({ groupIndex, tabIndex });
  };

  const handleDragLeave = () => {
    setDropTarget(null);
  };

  const handleDrop = (e: React.DragEvent, toGroupIndex: number, toTabIndex: number) => {
    e.preventDefault();
    if (dragState) {
      const { groupIndex: fromGroup, tabIndex: fromIndex } = dragState;
      // Only move if target is different
      if (fromGroup !== toGroupIndex || fromIndex !== toTabIndex) {
        handleTabMove(fromGroup, fromIndex, toGroupIndex, toTabIndex);
      }
    }
    setDragState(null);
    setDropTarget(null);
  };

  const handleDragEnd = () => {
    setDragState(null);
    setDropTarget(null);
  };

  // Check if separator should show between tabs (within a group)
  const shouldShowTabSeparator = (groupIndex: number, tabIndex: number) => {
    if (tabIndex === 0) return false;
    const activeIndex = groups[groupIndex].activeIndex;
    return activeIndex !== tabIndex && activeIndex !== tabIndex - 1;
  };

  // Get splitRatio from props (only available in multi-group mode)
  const splitRatio = isMultiGroup ? (props as MultiGroupProps).splitRatio ?? 0.5 : 0.5;

  return (
    <div ref={containerRef} className="flex items-end h-full w-full overflow-hidden">
      {groups.map((group, groupIndex) => (
        <div
          key={groupIndex}
          className="flex items-end h-full"
          style={isMultiGroup ? {
            flex: groupIndex === 0 ? splitRatio : 1 - splitRatio,
            minWidth: 0,
          } : undefined}
        >

          {/* Tabs in this group */}
          {group.tabs.map((tab, tabIndex) => {
            const isActive = tabIndex === group.activeIndex;
            const showSeparator = shouldShowTabSeparator(groupIndex, tabIndex);
            const tabStyles = getTabStyles(tab.variant, isActive);
            const isClosable = tab.closable !== false;
            const isUtility = tab.variant === "utility";
            const isDragging = dragState?.groupIndex === groupIndex && dragState?.tabIndex === tabIndex;
            const isDropTarget = dropTarget?.groupIndex === groupIndex && dropTarget?.tabIndex === tabIndex;

            return (
              <div
                key={tab.id}
                className={`group flex items-end h-full flex-shrink-0 ${isDragging ? "opacity-50" : ""}`}
                draggable={isMultiGroup}
                onDragStart={(e) => handleDragStart(e, groupIndex, tabIndex)}
                onDragOver={(e) => handleDragOver(e, groupIndex, tabIndex)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, groupIndex, tabIndex)}
                onDragEnd={handleDragEnd}
              >
                {showSeparator && (
                  <span className="self-stretch flex items-center px-1 mt-1 text-slate-600 select-none">
                    |
                  </span>
                )}
                <div
                  className={`relative flex items-end h-full ${isDropTarget ? "ring-2 ring-indigo-500 ring-inset rounded-t-md" : ""}`}
                  style={{ width: tabWidth }}
                >
                  <button
                    onClick={() => handleTabChange(groupIndex, tabIndex)}
                    onContextMenu={(e) => {
                      if (props.tabContextMenu) {
                        handleContextMenu(e, tab.id, isClosable);
                      }
                    }}
                    title={tab.title}
                    className={`
                      flex items-center justify-start px-1.5 pr-6 text-sm transition-colors
                      min-w-0 flex-shrink-0 w-full cursor-pointer
                      ${tabStyles}
                    `}
                    aria-label={`Switch to ${tab.title}`}
                  >
                    <span className="truncate min-w-0">{tab.title}</span>
                  </button>
                  {isClosable && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleTabClose(groupIndex, tabIndex);
                      }}
                      aria-label={`Close ${tab.title}`}
                      title={`Close ${tab.title}`}
                      className={`absolute right-2 top-4 z-20 ${
                        isActive
                          ? (isUtility ? "text-indigo-200" : "text-slate-200")
                          : (isUtility ? "text-indigo-400" : "text-slate-400")
                      } hover:text-slate-100 transition-opacity opacity-0 group-hover:opacity-100 group-focus-within:opacity-100`}
                      type="button"
                    >
                      <IconX className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ))}

      {/* Tab context menu portal */}
      {isOpen && position && menuState && props.tabContextMenu && createPortal(
        <div className="fixed inset-0 z-50" onClick={handleCloseMenu}>
          <div
            className="absolute w-44 rounded bg-slate-900 border border-slate-700 shadow-lg overflow-hidden"
            style={{ top: position.top, left: position.left }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="py-1">
              {/* Split options - only show if there are 2+ tabs */}
              {totalTabs > 1 && (
                <>
                  <button
                    onClick={() => {
                      props.tabContextMenu?.onSplitHorizontal?.(menuState.tabId);
                      handleCloseMenu();
                    }}
                    className="flex w-full items-center gap-2 px-3 py-2 text-sm text-slate-200 hover:bg-slate-800"
                  >
                    <IconLayoutColumns className="w-4 h-4" />
                    <span>Split Horizontally</span>
                  </button>
                  <button
                    onClick={() => {
                      props.tabContextMenu?.onSplitVertical?.(menuState.tabId);
                      handleCloseMenu();
                    }}
                    className="flex w-full items-center gap-2 px-3 py-2 text-sm text-slate-200 hover:bg-slate-800"
                  >
                    <IconLayoutRows className="w-4 h-4" />
                    <span>Split Vertically</span>
                  </button>
                  <div className="h-px bg-slate-800 my-1" />
                </>
              )}

              {/* Copy operations */}
              <button
                onClick={() => {
                  props.tabContextMenu?.onCopyFile?.(menuState.tabId);
                  handleCloseMenu();
                }}
                className="flex w-full items-center gap-2 px-3 py-2 text-sm text-slate-200 hover:bg-slate-800"
              >
                <IconCopy className="w-4 h-4" />
                <span>Copy File</span>
              </button>
              <button
                onClick={() => {
                  props.tabContextMenu?.onCopyPath?.(menuState.tabId);
                  handleCloseMenu();
                }}
                className="flex w-full items-center gap-2 px-3 py-2 text-sm text-slate-200 hover:bg-slate-800"
              >
                <IconLink className="w-4 h-4" />
                <span>Copy Path</span>
              </button>
              <div className="h-px bg-slate-800 my-1" />

              {/* Rename */}
              <button
                onClick={() => {
                  props.tabContextMenu?.onRename?.(menuState.tabId);
                  handleCloseMenu();
                }}
                className="flex w-full items-center gap-2 px-3 py-2 text-sm text-slate-200 hover:bg-slate-800"
              >
                <IconPencil className="w-4 h-4" />
                <span>Rename</span>
              </button>

              {/* Delete - only if closable */}
              {menuState.isClosable && (
                <>
                  <div className="h-px bg-slate-800 my-1" />
                  <button
                    onClick={() => {
                      props.tabContextMenu?.onDelete?.(menuState.tabId);
                      handleCloseMenu();
                    }}
                    className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-slate-800"
                  >
                    <IconTrash className="w-4 h-4" />
                    <span>Delete</span>
                  </button>
                </>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
