import { colors, spacing } from "../tokens"

export const input = {
  base: `w-full bg-${colors.surface.overlay} border border-${colors.border.default} text-sm text-${colors.text.secondary} placeholder:text-${colors.text.disabled} outline-none transition-colors`,
  focus: `focus:border-${colors.border.focus} focus:ring-1 focus:ring-${colors.border.focus}/40`,

  size: {
    sm: `${spacing.input.sm.height} ${spacing.input.sm.padding} ${spacing.rounded.md}`,
    md: `${spacing.input.md.height} ${spacing.input.md.padding} ${spacing.rounded.lg}`,
  },

  error: "border-rose-500/50 focus:border-rose-500 focus:ring-rose-500/40",
} as const

export const INPUT_DEFAULT = `${input.base} ${input.focus} ${input.size.md}`
