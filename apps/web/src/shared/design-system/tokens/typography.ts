export const typography = {
  fontFamily: {
    sans: 'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", "Helvetica Neue", Arial, sans-serif',
    mono: "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
  },

  fontSize: {
    xs: "text-xs", // 12px - badges, labels
    sm: "text-sm", // 14px - body small
    base: "text-base", // 16px - body
    lg: "text-lg", // 18px - subheadings
    xl: "text-xl", // 20px - headings
    "2xl": "text-2xl", // 24px - page titles
  },

  fontWeight: {
    normal: "font-normal",
    medium: "font-medium",
    semibold: "font-semibold",
    bold: "font-bold",
  },
} as const
