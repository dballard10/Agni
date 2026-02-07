import { IconX, IconLayoutColumns, IconLayoutRows, IconLayoutList, IconLink, IconCopy, IconPencil, IconTrash, IconPlus } from "@tabler/icons-react";
import { useRef, useState, useEffect, useCallback, useMemo } from "react";
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

interface DropTarget {
  groupIndex: number;
  tabIndex: number;
  position: 'before' | 'after';
}

export interface TabContextMenuCallbacks {
  onSplitBelow?: (tabId: string) => void;
  onSplitRight?: (tabId: string) => void;
  onCloseSplit?: () => void;
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
  onTabReorder?: (fromIndex: number, toIndex: number) => void;
  onAddTab?: () => void;
  tabContextMenu?: TabContextMenuCallbacks;
  groups?: never;
  onGroupTabChange?: never;
  onGroupTabClose?: never;
  onTabMove?: never;
  onGroupAddTab?: never;
}

// Multi-group mode (for split view)
interface MultiGroupProps {
  groups: TabGroup[];
  onGroupTabChange: (groupIndex: number, tabIndex: number) => void;
  onGroupTabClose?: (groupIndex: number, tabIndex: number) => void;
  onTabMove?: (fromGroup: number, fromIndex: number, toGroup: number, toIndex: number) => void;
  onGroupAddTab?: (groupIndex: number) => void;
  // Split ratio for proportional group widths (0-1)
  splitRatio?: number;
  tabContextMenu?: TabContextMenuCallbacks;
  tabs?: never;
  activeIndex?: never;
  onTabChange?: never;
  onTabClose?: never;
  onAddTab?: never;
}

type PageTabsProps = SingleGroupProps | MultiGroupProps;

const MAX_TAB_WIDTH = 144;

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
  const groupRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [dragState, setDragState] = useState<DragState | null>(null);
  const [dropTarget, setDropTarget] = useState<DropTarget | null>(null);

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
  const isMultiGroup = !!props.groups;
  const groups: TabGroup[] = useMemo(
    () => props.groups ?? [{ tabs: props.tabs!, activeIndex: props.activeIndex! }],
    [props.groups, props.tabs, props.activeIndex]
  );

  // Check if single-group reordering is enabled
  const canReorderSingle = !isMultiGroup && !!(props as SingleGroupProps).onTabReorder;

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

  // Calculate total tabs
  const totalTabs = groups.reduce((sum, g) => sum + g.tabs.length, 0);

  // Extract active indices for dependency tracking
  const activeIndices = useMemo(() => groups.map(g => g.activeIndex), [groups]);

  // Auto-scroll active tab into view when it changes
  useEffect(() => {
    activeIndices.forEach((activeIndex, groupIndex) => {
      const container = groupRefs.current[groupIndex];
      if (!container) return;
      const activeTab = container.children[activeIndex] as HTMLElement;
      activeTab?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
    });
  }, [activeIndices]);

  // Convert vertical scroll to horizontal
  const handleWheel = useCallback((e: React.WheelEvent, groupIndex: number) => {
    const container = groupRefs.current[groupIndex];
    if (container && e.deltaY !== 0) {
      e.preventDefault();
      container.scrollLeft += e.deltaY;
    }
  }, []);

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

    // Determine if dropping before or after based on mouse position
    const target = e.currentTarget as HTMLElement;
    const rect = target.getBoundingClientRect();
    const midpoint = rect.left + rect.width / 2;
    const position: 'before' | 'after' = e.clientX < midpoint ? 'before' : 'after';

    setDropTarget({ groupIndex, tabIndex, position });
  };

  const handleDragLeave = () => {
    setDropTarget(null);
  };

  const handleDrop = (e: React.DragEvent, toGroupIndex: number, toTabIndex: number) => {
    e.preventDefault();
    if (dragState && dropTarget) {
      const { groupIndex: fromGroup, tabIndex: fromIndex } = dragState;

      if (isMultiGroup) {
        // Multi-group mode: use existing behavior
        if (fromGroup !== toGroupIndex || fromIndex !== toTabIndex) {
          handleTabMove(fromGroup, fromIndex, toGroupIndex, toTabIndex);
        }
      } else if (canReorderSingle) {
        // Single-group mode: calculate insertion index based on position
        let insertIndex = dropTarget.position === 'before' ? toTabIndex : toTabIndex + 1;
        // Adjust if dragging from before the insertion point
        if (fromIndex < insertIndex) {
          insertIndex--;
        }
        if (fromIndex !== insertIndex) {
          (props as SingleGroupProps).onTabReorder!(fromIndex, insertIndex);
        }
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
          ref={(el) => { groupRefs.current[groupIndex] = el; }}
          className="flex items-end h-full overflow-x-auto scrollbar-thin-hover"
          style={isMultiGroup ? {
            flex: groupIndex === 0 ? splitRatio : 1 - splitRatio,
            minWidth: 0,
          } : undefined}
          onWheel={(e) => handleWheel(e, groupIndex)}
        >

          {/* Tabs in this group */}
          {group.tabs.map((tab, tabIndex) => {
            const isActive = tabIndex === group.activeIndex;
            const showSeparator = shouldShowTabSeparator(groupIndex, tabIndex);
            const tabStyles = getTabStyles(tab.variant, isActive);
            const isClosable = tab.closable !== false;
            const isUtility = tab.variant === "utility";
            const isDragging = dragState?.groupIndex === groupIndex && dragState?.tabIndex === tabIndex;
            const isDropTargetBefore = dropTarget?.groupIndex === groupIndex && dropTarget?.tabIndex === tabIndex && dropTarget?.position === 'before';
            const isDropTargetAfter = dropTarget?.groupIndex === groupIndex && dropTarget?.tabIndex === tabIndex && dropTarget?.position === 'after';
            const isLastTab = tabIndex === group.tabs.length - 1;

            return (
              <div
                key={tab.id}
                className={`group flex items-end h-full flex-shrink-0 relative ${isDragging ? "opacity-50" : ""}`}
                draggable={isMultiGroup || canReorderSingle}
                onDragStart={(e) => handleDragStart(e, groupIndex, tabIndex)}
                onDragOver={(e) => handleDragOver(e, groupIndex, tabIndex)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, groupIndex, tabIndex)}
                onDragEnd={handleDragEnd}
              >
                {/* Drop indicator - before */}
                {isDropTargetBefore && (
                  <div className="absolute left-0 top-1 bottom-1 w-0.5 bg-indigo-500 z-30" />
                )}
                {showSeparator && (
                  <span className="self-stretch flex items-center mt-1 text-slate-600 select-none">
                    |
                  </span>
                )}
                <div
                  className="relative flex items-end h-full"
                  style={{ width: MAX_TAB_WIDTH }}
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
                {/* Drop indicator - after (only show on last tab) */}
                {isDropTargetAfter && isLastTab && (
                  <div className="absolute right-0 top-1 bottom-1 w-0.5 bg-indigo-500 z-30" />
                )}
              </div>
            );
          })}

          {/* Add tab button */}
          {(isMultiGroup ? (props as MultiGroupProps).onGroupAddTab : (props as SingleGroupProps).onAddTab) && (
            <button
              onClick={() => {
                if (isMultiGroup) {
                  (props as MultiGroupProps).onGroupAddTab?.(groupIndex);
                } else {
                  (props as SingleGroupProps).onAddTab?.();
                }
              }}
              className="flex-shrink-0 flex items-center justify-center w-7 h-[calc(100%-8px)]
                         text-slate-400 hover:text-slate-200 hover:bg-slate-800/50
                         rounded-t-md transition-colors ml-0.5"
              aria-label="New tab"
              title="New tab"
            >
              <IconPlus className="w-4 h-4" />
            </button>
          )}
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
              {totalTabs > 1 && !isMultiGroup && (
                <>
                  <button
                    onClick={() => {
                      props.tabContextMenu?.onSplitRight?.(menuState.tabId);
                      handleCloseMenu();
                    }}
                    className="flex w-full items-center gap-2 px-3 py-2 text-sm text-slate-200 hover:bg-slate-800"
                  >
                    <IconLayoutColumns className="w-4 h-4" />
                    <span>Split Right</span>
                  </button>
                  <button
                    onClick={() => {
                      props.tabContextMenu?.onSplitBelow?.(menuState.tabId);
                      handleCloseMenu();
                    }}
                    className="flex w-full items-center gap-2 px-3 py-2 text-sm text-slate-200 hover:bg-slate-800"
                  >
                    <IconLayoutRows className="w-4 h-4" />
                    <span>Split Below</span>
                  </button>
                  <div className="h-px bg-slate-800 my-1" />
                </>
              )}

              {/* Close split option - only show when in split mode */}
              {isMultiGroup && (
                <>
                  <button
                    onClick={() => {
                      props.tabContextMenu?.onCloseSplit?.();
                      handleCloseMenu();
                    }}
                    className="flex w-full items-center gap-2 px-3 py-2 text-sm text-slate-200 hover:bg-slate-800"
                  >
                    <IconLayoutList className="w-4 h-4" />
                    <span>Close Split</span>
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
