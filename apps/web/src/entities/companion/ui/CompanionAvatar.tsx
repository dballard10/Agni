import { getInitials } from "@/shared/lib/string";

interface CompanionAvatarProps {
  name: string;
  color?: string;
  size: "sm" | "lg";
  className?: string;
}

const sizeStyles = {
  sm: "w-5 h-5 text-[9px] font-bold shadow-lg",
  lg: "w-14 h-14 text-xl font-bold shadow-lg",
};

export default function CompanionAvatar({
  name,
  color = "#64748b",
  size,
  className = "",
}: CompanionAvatarProps) {
  return (
    <div
      className={`rounded-full flex items-center justify-center text-white ${sizeStyles[size]} ${className}`}
      style={{ backgroundColor: color }}
      title={name}
    >
      {getInitials(name)}
    </div>
  );
}
