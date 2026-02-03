export const TASK_DETAILS_ROOT = "flex flex-col h-full";
export const TASK_DETAILS_HEADER =
  "top-0 z-10 flex flex-col gap-4 border-b-2 border-slate-700/80 bg-slate-900/95 backdrop-blur-sm px-4 pt-4 pb-4";
export const TASK_DETAILS_HEADER_ROW = "flex items-start gap-3";
export const TASK_DETAILS_TITLE_INPUT =
  "text-xl font-bold text-slate-100 leading-tight bg-transparent border-none outline-none p-0 mt-1.5 focus:ring-0 w-full placeholder-slate-500";
export const TASK_DETAILS_TITLE_DISPLAY =
  "text-xl font-bold text-slate-100 leading-tight break-words cursor-text hover:text-white mt-1.5 transition-colors";

export const TASK_TYPE_SELECTOR_WRAPPER =
  "flex flex-wrap items-center justify-between gap-4";
export const TASK_TYPE_SELECTOR_LABEL =
  "flex flex-col gap-2 text-xs text-slate-500 font-medium uppercase tracking-wider";
export const TASK_TYPE_SELECTOR_BUTTONS = "flex flex-wrap gap-2";
export const TASK_TYPE_BUTTON_BASE =
  "px-3 py-1 rounded text-xs font-semibold uppercase tracking-wide transition-all hover:ring-1 hover:ring-slate-500/60 hover:ring-inset";
export const TASK_TYPE_BUTTON_SELECTED = "shadow-sm";
export const TASK_TYPE_BUTTON_UNSELECTED =
  "bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-900/60";

export const TASK_LINKS_GRID =
  "grid grid-cols-1 md:grid-cols-2 gap-6 border-b-2 border-slate-700/80 pb-6";

export const TASK_SECTION_DIVIDER = "h-[2px] bg-slate-700/80";

export const TASK_GOAL_SELECTOR = "space-y-2 relative";
export const TASK_GOAL_SELECTOR_LABEL =
  "flex items-center gap-2 text-sm font-medium text-slate-400";
export const TASK_SELECTOR_TRIGGER =
  "w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-sm text-slate-200 outline-none hover:border-slate-600 cursor-pointer flex items-center justify-between transition-colors min-h-[38px] focus:ring-1 focus:outline-none";
export const TASK_GOAL_TRIGGER = `${TASK_SELECTOR_TRIGGER} border-slate-600 focus:border-emerald-500 focus:ring-emerald-500/40`;
export const TASK_COMPANION_TRIGGER = `${TASK_SELECTOR_TRIGGER} border-slate-600 focus:border-orange-500 focus:ring-orange-500/40`;
export const TASK_SELECTOR_DROPDOWN =
  "absolute top-full left-0 right-0 mt-1 bg-slate-900 border border-slate-700 rounded-lg shadow-xl overflow-hidden max-h-60 overflow-y-auto z-30 ring-1 ring-slate-800 animate-in fade-in zoom-in-95 duration-100";
export const TASK_GOAL_DROPDOWN = TASK_SELECTOR_DROPDOWN;

export const TASK_SELECTOR_SEARCH_WRAPPER =
  "sticky top-0 z-10 bg-slate-900 border-b border-slate-800 p-2";
export const TASK_SELECTOR_SEARCH_INPUT =
  "w-full bg-slate-800 border border-slate-700 rounded-md pl-8 pr-3 py-1.5 text-xs text-slate-200 outline-none focus:border-indigo-500 transition-colors placeholder:text-slate-500";
export const TASK_SELECTOR_SEARCH_ICON =
  "absolute left-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500";

export const TASK_GOAL_BUTTON =
  "w-full flex items-center gap-2 px-2 py-1.5 rounded transition-colors text-left group";
export const TASK_GOAL_BUTTON_SELECTED = "bg-indigo-600/10 text-indigo-200";
export const TASK_GOAL_BUTTON_UNSELECTED =
  "hover:bg-slate-800 text-slate-300 hover:text-slate-100";
export const TASK_GOAL_PILLS_WRAP = "flex flex-wrap gap-2 pt-1";
export const TASK_GOAL_PILL =
  "group flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium border bg-indigo-600/20 border-indigo-500/50 text-indigo-200 hover:bg-rose-500/20 hover:border-rose-500/50 hover:text-rose-200 transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-400";
export const TASK_GOAL_PILL_AVATAR_BORDER =
  "absolute inset-0 flex items-center justify-center rounded-full border border-slate-800 bg-slate-700 text-white shadow-sm transition-all duration-150 group-hover:opacity-0 group-hover:border-transparent group-hover:bg-transparent group-hover:shadow-none";
export const TASK_GOAL_PILL_REMOVE_ICON =
  "absolute inset-0 flex items-center justify-center opacity-0 transition-opacity duration-150 group-hover:opacity-100 group-focus-within:opacity-100";

export const TASK_COMPANION_SELECTOR = "space-y-2 relative";
export const TASK_COMPANION_LABEL =
  "flex items-center gap-2 text-sm font-medium text-slate-400";
export const TASK_COMPANION_DROPDOWN = TASK_SELECTOR_DROPDOWN;
export const TASK_COMPANION_INPUT_WRAPPER = "relative z-20";
export const TASK_COMPANION_INPUT = TASK_SELECTOR_SEARCH_INPUT;
export const TASK_COMPANION_SUGGESTION =
  "w-full flex items-center gap-2 px-2 py-1.5 hover:bg-slate-800 rounded transition-colors text-left group";
export const TASK_COMPANION_AVATAR =
  "w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold text-white shadow-sm";
export const TASK_COMPANION_SELECTED_LIST = "flex flex-wrap gap-2";
export const TASK_COMPANION_PILL =
  "group flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium border bg-indigo-600/20 border-indigo-500/50 text-indigo-200 hover:bg-rose-500/20 hover:border-rose-500/50 hover:text-rose-200 transition-all";
export const TASK_COMPANION_PILL_AVATAR =
  "absolute inset-0 w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-bold text-white shadow-sm transition-opacity group-hover:opacity-0";
export const TASK_COMPANION_PILL_ICON =
  "absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity";
export const TASK_COMPANION_SHOW_MORE_BUTTON =
  "px-2 py-1 rounded-full text-xs font-medium border bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700 hover:text-slate-200 transition-colors";

export const TASK_FORM_WRAPPER = "flex-1 px-4 pb-4 pt-6 space-y-6";

export const TASK_DETAILS_ACTIONS_WRAPPER = "mt-8 pt-6 border-t border-slate-700";
export const TASK_DETAILS_DELETE_BUTTON =
  "w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium text-red-400 bg-red-500/10 border border-red-500/30 hover:bg-red-500/20 hover:text-red-300 hover:border-red-500/50 transition-colors";
