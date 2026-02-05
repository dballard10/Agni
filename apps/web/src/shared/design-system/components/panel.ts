import { colors, spacing } from "../tokens"

export const panel = {
  base: `bg-${colors.surface.raised} border border-${colors.border.default}`,

  variant: {
    card: `${spacing.rounded.lg}`,
    elevated: `${spacing.rounded.lg} shadow-xl`,
    modal: `${spacing.rounded.lg} shadow-2xl`,
  },

  header: `flex items-center justify-between ${spacing.panel.md} border-b border-${colors.border.subtle}`,
  body: spacing.panel.md,
  footer: `${spacing.panel.md} bg-slate-950/30`,
} as const

export const MODAL_OVERLAY =
  "fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50"
export const MODAL_CONTAINER = `relative ${panel.base} ${panel.variant.modal} max-w-md w-full`
export const CARD = `${panel.base} ${panel.variant.card}`
