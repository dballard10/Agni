import { colors, spacing } from "../tokens"

export const badge = {
  base: `inline-flex items-center ${spacing.rounded.full} text-xs font-semibold`,

  size: {
    sm: "px-2 py-0.5",
    md: "px-3 py-1",
  },

  variant: {
    default: `bg-${colors.surface.overlay} text-${colors.text.muted}`,
    primary: "bg-indigo-600/20 text-indigo-300 border border-indigo-500/50",
    success: `bg-${colors.status.successBg} text-${colors.status.success}`,
    warning: `bg-${colors.status.warningBg} text-${colors.status.warning}`,
    error: `bg-${colors.status.errorBg} text-${colors.status.error}`,
  },
} as const

// Task status badges (matches existing pattern)
export const STATUS_BADGE = {
  open: `${badge.base} ${badge.size.sm} bg-indigo-700/70 text-indigo-400`,
  completed: `${badge.base} ${badge.size.sm} bg-emerald-700/70 text-emerald-400`,
  failed: `${badge.base} ${badge.size.sm} bg-rose-700/70 text-rose-400`,
  cancelled: `${badge.base} ${badge.size.sm} bg-slate-700/70 text-slate-400`,
  moved: `${badge.base} ${badge.size.sm} bg-amber-700/70 text-amber-400`,
} as const
