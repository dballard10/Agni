export const spacing = {
  icon: {
    xs: { size: 14, class: "w-3.5 h-3.5" },
    sm: { size: 16, class: "w-4 h-4" },
    md: { size: 20, class: "w-5 h-5" },
    lg: { size: 24, class: "w-6 h-6" },
  },

  button: {
    sm: { height: "h-8", padding: "px-3 py-1.5" },
    md: { height: "h-10", padding: "px-4 py-2" },
    lg: { height: "h-12", padding: "px-6 py-3" },
  },

  input: {
    sm: { height: "h-8", padding: "px-2 py-1" },
    md: { height: "h-10", padding: "px-3 py-2" },
  },

  panel: {
    sm: "p-3",
    md: "p-4",
    lg: "p-6",
  },

  gap: {
    xs: "gap-1",
    sm: "gap-2",
    md: "gap-4",
    lg: "gap-6",
  },

  rounded: {
    sm: "rounded-md",
    md: "rounded-lg",
    lg: "rounded-xl",
    full: "rounded-full",
  },
} as const
