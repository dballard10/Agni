import type { WeeklyItemType } from "../../../shared/types/weekly";

export interface ItemTypeStyle {
  label: string;
  cardBackground: string;
  textColor: string;
  pillBackground: string;
  badgeText: string;
  colorHex: string;
}

export const ITEM_TYPE_STYLES: Record<WeeklyItemType, ItemTypeStyle> = {
  task: {
    label: "Task",
    cardBackground: "bg-gradient-to-r from-emerald-800/70 to-emerald-950/90",
    textColor: "text-emerald-100",
    pillBackground: "bg-emerald-500/20 border border-emerald-400/40",
    badgeText: "text-emerald-200",
    colorHex: "#10b981",
  },
  event: {
    label: "Event",
    cardBackground: "bg-gradient-to-r from-sky-600/70 to-blue-900/80",
    textColor: "text-blue-100",
    pillBackground: "bg-blue-500/20 border border-blue-400/40",
    badgeText: "text-blue-200",
    colorHex: "#3b82f6",
  },
  birthday: {
    label: "Birthday",
    cardBackground: "bg-gradient-to-r from-pink-600/70 to-rose-900/80",
    textColor: "text-pink-100",
    pillBackground: "bg-pink-500/20 border border-pink-400/40",
    badgeText: "text-pink-200",
    colorHex: "#ec4899",
  },
  holiday: {
    label: "Holiday",
    cardBackground: "bg-gradient-to-r from-red-600/70 to-rose-900/80",
    textColor: "text-red-100",
    pillBackground: "bg-red-500/20 border border-red-400/40",
    badgeText: "text-red-200",
    colorHex: "#ef4444",
  },
};

export const INFORMATIONAL_TYPES: WeeklyItemType[] = ["birthday", "holiday"];

export const ITEM_TYPE_PRIORITIES: WeeklyItemType[] = [
  "holiday",
  "birthday",
  "event",
  "task",
];

export const ITEM_TYPE_BADGES: Record<WeeklyItemType, string> = {
  task: "emerald-500",
  event: "blue-500",
  birthday: "pink-500",
  holiday: "red-500",
};
