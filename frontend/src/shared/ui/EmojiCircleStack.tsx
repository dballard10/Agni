import type { CSSProperties } from "react";

export interface EmojiCircleStackItem {
  id: string;
  emoji?: string;
  label?: string;
  style?: CSSProperties;
}

interface EmojiCircleStackProps {
  items: EmojiCircleStackItem[];
  maxVisible?: number;
  size?: number;
  containerClassName?: string;
  circleClassName?: string;
  overflowClassName?: string;
}

export default function EmojiCircleStack({
  items,
  maxVisible = 3,
  size = 20,
  containerClassName = "-space-x-1",
  circleClassName = "border border-slate-800 bg-slate-700 text-[10px] text-white shadow-sm",
  overflowClassName = "border border-slate-800 bg-slate-900/70 text-[10px] text-slate-300 font-semibold",
}: EmojiCircleStackProps) {
  if (items.length === 0) {
    return null;
  }

  const visibleItems = items.slice(0, maxVisible);
  const overflowCount = Math.max(items.length - maxVisible, 0);
  const sizeStyles: CSSProperties = {
    width: size,
    height: size,
  };

  return (
    <div
      className={`flex items-center ${containerClassName}`}
      aria-live="polite"
    >
      {visibleItems.map((item) => (
        <span
          key={item.id}
          className={`flex items-center justify-center rounded-full ${circleClassName}`}
          style={{ ...sizeStyles, ...item.style }}
          title={item.label}
        >
          {item.emoji || "🎯"}
        </span>
      ))}
      {overflowCount > 0 && (
        <span
          className={`flex items-center justify-center rounded-full ${overflowClassName}`}
          style={sizeStyles}
          title={`${overflowCount} more goals`}
        >
          +{overflowCount}
        </span>
      )}
    </div>
  );
}
