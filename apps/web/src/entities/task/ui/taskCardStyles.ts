import type { WeeklyItemType } from "../../../shared/types/weekly";

export interface TaskCardStyleOptions {
  backgroundClass?: string;
  textClass?: string;
  isClickable?: boolean;
  itemType?: WeeklyItemType;
}

export const TASK_CARD_CONTAINER =
  "group relative w-full max-w-[1100px] mx-auto rounded border overflow-hidden transition-all";
export const TASK_CARD_BODY = "flex items-center gap-2 w-full p-2 pr-8";
export const TASK_CARD_TITLE_INPUT =
  "flex-1 w-full px-2 py-1 bg-transparent rounded text-inherit focus:outline-none";
export const TASK_CARD_TITLE_DISPLAY =
  "inline-block text-inherit cursor-text transition-transform origin-left hover:scale-105";
export const TASK_CARD_TITLE_WRAPPER =
  "flex-1 px-2 py-1 select-none truncate transition-transform duration-300 ease-out group-hover:-translate-x-3 group-focus-within:-translate-x-3";
export const TASK_CARD_INDICATORS_ROW =
  "flex items-center gap-2 transition-transform duration-300 ease-out group-hover:-translate-x-3 group-focus-within:-translate-x-3";
export const TASK_INDICATOR_GROUP =
  "flex items-center gap-3 px-2 opacity-70 group-hover:opacity-100 transition-opacity flex-shrink-0";
export const TASK_KIND_BADGE =
  "flex-shrink-0 h-6 flex items-center justify-center min-w-[40px]";

export const TASK_ACTIONS_CONTAINER = "absolute right-1 top-1/2 -translate-y-1/2 flex items-center z-10 group/actions";

export const TASK_ACTIONS_BASE_BUTTON = 
  "p-1 rounded transition-all duration-200 ease-out text-slate-400 hover:text-slate-100 hover:bg-slate-800 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100";

export const TASK_ACTIONS_STRIP = 
  "absolute right-0 flex items-center rounded-lg pl-2 pr-8 py-1 gap-1 transition-all duration-300 ease-out origin-right opacity-0 translate-x-4 pointer-events-none group-hover/actions:opacity-100 group-hover/actions:translate-x-0 group-hover/actions:pointer-events-auto group-focus-within/actions:opacity-100 group-focus-within/actions:translate-x-0 group-focus-within/actions:pointer-events-auto border border-slate-700 shadow-xl";

export const TASK_ACTION_ITEM_BUTTON = 
  "p-1 rounded transition-colors text-slate-400 hover:text-slate-100 hover:bg-slate-700";

export const TASK_DELETE_BUTTON =
  "absolute right-1 top-1/2 -translate-y-1/2 p-1 rounded transition-all duration-200 ease-out text-slate-400 hover:text-red-400 hover:bg-slate-800 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 pointer-events-none group-hover:pointer-events-auto group-focus-within:pointer-events-auto";

export const TASK_TYPE_GRADIENTS_TO_SLATE: Record<WeeklyItemType, string> = {
  task: "bg-gradient-to-r from-emerald-800/50 to-slate-950",
  event: "bg-gradient-to-r from-blue-800/50 to-slate-950",
  birthday: "bg-gradient-to-r from-pink-800/50 to-slate-950",
  holiday: "bg-gradient-to-r from-red-800/50 to-slate-950",
};

export function getTaskCardStyleClass(options: TaskCardStyleOptions = {}) {
  const gradientClass =
    TASK_TYPE_GRADIENTS_TO_SLATE[options.itemType ?? "task"];
  const backgroundClass = options.backgroundClass || gradientClass;
  const textClass = options.textClass || "text-slate-200";
  const interactionClass = options.isClickable
    ? "cursor-pointer"
    : "cursor-default";
  return `${backgroundClass} ${textClass} border-slate-700 hover:border-slate-500 shadow-sm ${interactionClass}`;
}

// Helper to convert hex to rgba for gradients
function hexToRgba(hex: string, alpha: number): string {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return hex;
  const r = parseInt(result[1], 16);
  const g = parseInt(result[2], 16);
  const b = parseInt(result[3], 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

// Generate dynamic gradient style for task cards based on custom color
export function getDynamicTaskCardGradientStyle(
  colorHex: string
): React.CSSProperties {
  return {
    background: `linear-gradient(to right, ${hexToRgba(
      colorHex,
      0.5
    )}, rgb(2, 6, 23))`,
  };
}

// Get classes without the background (for use with dynamic inline styles)
export function getTaskCardBaseClasses(options: TaskCardStyleOptions = {}) {
  const textClass = options.textClass || "text-slate-200";
  const interactionClass = options.isClickable
    ? "cursor-pointer"
    : "cursor-default";
  return `${textClass} border-slate-700 hover:border-slate-500 shadow-sm ${interactionClass}`;
}
