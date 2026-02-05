import { colors, spacing } from "../tokens"

export const button = {
  base: "inline-flex items-center justify-center font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900",

  variant: {
    primary: `bg-${colors.accent.primary} hover:bg-${colors.accent.primaryHover} text-white focus-visible:ring-indigo-500`,
    secondary: `bg-${colors.surface.overlay} hover:bg-${colors.surface.muted} text-${colors.text.secondary} border border-${colors.border.default}`,
    ghost: `text-${colors.text.muted} hover:bg-${colors.surface.overlay} hover:text-${colors.text.secondary}`,
    danger: "bg-rose-600 hover:bg-rose-500 text-white",
    dangerGhost: "text-rose-400 hover:bg-rose-500/10",
  },

  size: {
    sm: `${spacing.button.sm.height} ${spacing.button.sm.padding} text-xs ${spacing.rounded.sm}`,
    md: `${spacing.button.md.height} ${spacing.button.md.padding} text-sm ${spacing.rounded.md}`,
    lg: `${spacing.button.lg.height} ${spacing.button.lg.padding} text-base ${spacing.rounded.lg}`,
  },

  iconOnly: {
    sm: `w-8 h-8 ${spacing.rounded.sm}`,
    md: `w-10 h-10 ${spacing.rounded.md}`,
  },
} as const

// Pre-composed exports for common use
export const BUTTON_PRIMARY_MD = `${button.base} ${button.variant.primary} ${button.size.md}`
export const BUTTON_SECONDARY_MD = `${button.base} ${button.variant.secondary} ${button.size.md}`
export const BUTTON_GHOST_MD = `${button.base} ${button.variant.ghost} ${button.size.md}`
export const BUTTON_ICON_MD = `${button.base} ${button.variant.ghost} ${button.iconOnly.md}`
