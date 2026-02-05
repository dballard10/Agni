export const colors = {
  // Surfaces
  surface: {
    base: "slate-950", // App background
    raised: "slate-900", // Cards, panels
    overlay: "slate-800", // Dropdowns, hover states
    muted: "slate-700", // Dividers, disabled
  },

  // Text
  text: {
    primary: "slate-50",
    secondary: "slate-200",
    muted: "slate-400",
    disabled: "slate-600",
  },

  // Borders
  border: {
    default: "slate-700",
    subtle: "slate-800",
    focus: "indigo-500",
  },

  // Accents
  accent: {
    primary: "indigo-600",
    primaryHover: "indigo-500",
  },

  // Status
  status: {
    success: "emerald-400",
    successBg: "emerald-700/70",
    warning: "amber-400",
    warningBg: "amber-700/70",
    error: "rose-400",
    errorBg: "rose-700/70",
    info: "sky-400",
  },
} as const
