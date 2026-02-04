interface PageTabsProps {
  activeTabIndex: number;
  onTabChange: (index: number) => void;
  tabCount?: number;
}

export function PageTabs({
  activeTabIndex,
  onTabChange,
  tabCount = 5,
}: PageTabsProps) {
  const tabs = Array.from({ length: tabCount }, (_, i) => `Tab ${i + 1}`);

  return (
    <div className="flex items-center gap-0">
      {tabs.map((label, index) => (
        <div key={index} className="flex items-center">
          {index > 0 && (
            <span className="text-slate-600 mx-3">|</span>
          )}
          <button
            onClick={() => onTabChange(index)}
            className={`px-2 py-1 text-sm transition-colors ${
              activeTabIndex === index
                ? "text-slate-100"
                : "text-slate-400 hover:text-slate-200"
            }`}
            aria-label={`Switch to ${label}`}
            title={label}
          >
            {label}
          </button>
        </div>
      ))}
    </div>
  );
}
