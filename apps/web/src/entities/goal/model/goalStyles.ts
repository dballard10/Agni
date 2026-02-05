export const GOAL_COLOR_OPTIONS = [
  {
    label: "Violet",
    value: "#8b5cf6",
    gradientClass: "bg-gradient-to-r from-violet-700/70 to-slate-900",
  },
  {
    label: "Sky",
    value: "#0ea5e9",
    gradientClass: "bg-gradient-to-r from-sky-700/70 to-slate-900",
  },
  {
    label: "Emerald",
    value: "#22c55e",
    gradientClass: "bg-gradient-to-r from-emerald-700/70 to-slate-900",
  },
  {
    label: "Orange",
    value: "#f97316",
    gradientClass: "bg-gradient-to-r from-orange-700/70 to-slate-900",
  },
  {
    label: "Rose",
    value: "#ec4899",
    gradientClass: "bg-gradient-to-r from-rose-700/70 to-slate-900",
  },
  {
    label: "Indigo",
    value: "#6366f1",
    gradientClass: "bg-gradient-to-r from-indigo-700/70 to-slate-900",
  },
  {
    label: "Blue",
    value: "#2563eb",
    gradientClass: "bg-gradient-to-r from-blue-700/70 to-slate-900",
  },
  {
    label: "Cyan",
    value: "#22d3ee",
    gradientClass: "bg-gradient-to-r from-cyan-700/70 to-slate-900",
  },
] as const;

export type GoalAccentColor = (typeof GOAL_COLOR_OPTIONS)[number]["value"];

export const GOAL_ACCENT_COLORS = GOAL_COLOR_OPTIONS.map(
  (option) => option.value
) as GoalAccentColor[];

export const DEFAULT_GOAL_COLOR = GOAL_ACCENT_COLORS[0];

const GOAL_COLOR_TO_GRADIENT = GOAL_COLOR_OPTIONS.reduce((acc, option) => {
  acc[option.value] = option.gradientClass;
  return acc;
}, {} as Record<GoalAccentColor, string>);

const DEFAULT_CARD_BACKGROUND_CLASS = "bg-slate-800/50";

export const DEFAULT_GOAL_BACKGROUND_CLASS = DEFAULT_CARD_BACKGROUND_CLASS;

export function normalizeGoalColor(
  value?: string
): GoalAccentColor | undefined {
  if (!value) return undefined;
  const normalized = value.trim().toLowerCase();
  const match = GOAL_ACCENT_COLORS.find(
    (color) => color.toLowerCase() === normalized
  );
  return match;
}

export function getGoalBackgroundClass(color?: string) {
  const normalized = normalizeGoalColor(color ?? DEFAULT_GOAL_COLOR);
  return normalized
    ? GOAL_COLOR_TO_GRADIENT[normalized]
    : DEFAULT_CARD_BACKGROUND_CLASS;
}

export const GOAL_CARD_HEADER = "flex justify-between items-start mb-3";
export const GOAL_CARD_EMOJI_WRAPPER =
  "relative flex items-center justify-center w-10 h-10 rounded-full border border-slate-700 bg-slate-900 text-xl text-slate-200";
