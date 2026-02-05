import type { CSSProperties, ReactNode } from "react";
import Avatar from "./Avatar";

export interface AvatarStackItem {
  id: string;
  /** Emoji, initials string, or custom ReactNode */
  content: ReactNode;
  /** Tooltip / aria-label */
  label?: string;
  /** Background color */
  bgColor?: string;
}

interface AvatarStackProps {
  items: AvatarStackItem[];
  /** Max avatars to show before overflow badge */
  maxVisible?: number;
  /** Size of each avatar in pixels */
  size?: number;
  /** Overlap spacing class (negative margin) */
  overlapClass?: string;
  /** Extra class for the container */
  className?: string;
}

/**
 * Renders a horizontal stack of Avatars with overlap and an optional +N overflow badge.
 */
export default function AvatarStack({
  items,
  maxVisible = 3,
  size = 24,
  overlapClass = "-space-x-1.5",
  className = "",
}: AvatarStackProps) {
  if (items.length === 0) return null;

  const visible = items.slice(0, maxVisible);
  const overflowCount = Math.max(items.length - maxVisible, 0);

  // Overflow badge font size
  const overflowFontSize = Math.max(8, Math.round(size * 0.38));

  const badgeSize: CSSProperties = { width: size, height: size };

  return (
    <div className={`flex items-center ${overlapClass} ${className}`}>
      {visible.map((item) => (
        <Avatar
          key={item.id}
          content={item.content}
          label={item.label}
          bgColor={item.bgColor}
          size={size}
        />
      ))}
      {overflowCount > 0 && (
        <span
          className="
            relative inline-flex items-center justify-center
            rounded-full
            font-semibold leading-none antialiased select-none
            bg-slate-800 text-slate-400
            ring-1 ring-white/10
            shadow-[0_1px_3px_rgba(0,0,0,0.4)]
          "
          style={badgeSize}
          title={`${overflowCount} more`}
        >
          <span style={{ fontSize: overflowFontSize }}>+{overflowCount}</span>
        </span>
      )}
    </div>
  );
}
