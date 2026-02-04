import { IconX } from "@tabler/icons-react";
import { useRef, useState, useEffect } from "react";

interface Tab {
  id: string;
  title: string;
}

interface PageTabsProps {
  tabs: Tab[];
  activeIndex: number;
  onTabChange: (index: number) => void;
  onTabClose?: (index: number) => void;
}

const MIN_TAB_WIDTH = 24;
const MAX_TAB_WIDTH = 144;

export function PageTabs({ tabs, activeIndex, onTabChange, onTabClose }: PageTabsProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [tabWidth, setTabWidth] = useState(MAX_TAB_WIDTH);

  // Measure available width and compute per-tab width
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      const availableWidth = entry.contentRect.width;
      if (tabs.length === 0) return;
      const perTab = Math.floor(availableWidth / tabs.length);
      const clamped = Math.max(MIN_TAB_WIDTH, Math.min(MAX_TAB_WIDTH, perTab));
      setTabWidth(clamped);
    });

    observer.observe(container);
    return () => observer.disconnect();
  }, [tabs.length]);

  if (tabs.length === 0) return null;

  // Determine if separator should show between index i-1 and i
  // Only show if neither adjacent tab is active
  const shouldShowSeparator = (index: number) => {
    if (index === 0) return false;
    return activeIndex !== index && activeIndex !== index - 1;
  };

  return (
    <div ref={containerRef} className="flex items-end h-full w-full overflow-hidden">
      {tabs.map((tab, index) => {
        const isActive = index === activeIndex;
        const showSeparator = shouldShowSeparator(index);
        return (
          <div key={tab.id} className="group flex items-end h-full flex-shrink-0">
            {showSeparator && (
              <span className="self-stretch flex items-center px-1 mt-1 text-slate-600 select-none">
                |
              </span>
            )}
            <div className="relative flex items-end h-full" style={{ width: tabWidth }}>
              <button
                onClick={() => onTabChange(index)}
                title={tab.title}
                className={`
                  flex items-center justify-start px-1.5 pr-6 text-sm transition-colors
                  min-w-0 flex-shrink-0 w-full
                  ${
                    isActive
                      ? "h-[calc(100%-8px)] bg-slate-800/90 text-slate-100 border border-slate-500 border-b-transparent rounded-t-md z-10"
                      : "h-[calc(100%-8px)] text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 rounded-t-md"
                  }
                `}
                aria-label={`Switch to ${tab.title}`}
              >
                <span className="truncate min-w-0">{tab.title}</span>
              </button>
              {onTabClose && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onTabClose(index);
                  }}
                  aria-label={`Close ${tab.title}`}
                  title={`Close ${tab.title}`}
                  className={`absolute right-2 top-4 z-20 ${isActive ? "text-slate-200" : "text-slate-400"} hover:text-slate-100 transition-opacity opacity-0 group-hover:opacity-100 group-focus-within:opacity-100`}
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
  );
}
