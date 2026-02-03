import type { CSSProperties, ReactNode } from "react";

export interface AvatarProps {
  /** Content to display: emoji, initials, or custom ReactNode */
  content: ReactNode;
  /** Tooltip / aria-label */
  label?: string;
  /** Background color (hex or CSS color) */
  bgColor?: string;
  /** Size in pixels (width = height) */
  size?: number;
  /** Extra class names for the outer container */
  className?: string;
  /** Inline styles merged onto the container */
  style?: CSSProperties;
}

/**
 * Shared Avatar component for goals (emoji) and companions (initials).
 * Renders a crisp, modern circular badge with a subtle ring and shadow.
 */
export default function Avatar({
  content,
  label,
  bgColor = "#475569",
  size = 24,
  className = "",
  style,
}: AvatarProps) {
  // Font size scales with avatar size
  const fontSize = Math.max(9, Math.round(size * 0.42));

  const containerStyle: CSSProperties = {
    width: size,
    height: size,
    backgroundColor: bgColor,
    ...style,
  };

  return (
    <span
      className={`
        relative inline-flex items-center justify-center
        rounded-full
        font-bold leading-none antialiased select-none
        ring-1 ring-white/15
        shadow-[0_1px_3px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.1)]
        ${className}
      `}
      style={containerStyle}
      title={label}
      aria-label={label}
    >
      <span
        className="flex items-center justify-center text-white"
        style={{ fontSize }}
      >
        {content}
      </span>
    </span>
  );
}
