import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import type { WeeklyItemType } from "../types/weekly";

// Default item type colors
const DEFAULT_ITEM_TYPE_COLORS: Record<WeeklyItemType, string> = {
  task: "#3b82f6",
  event: "#8b5cf6",
  birthday: "#ec4899",
  holiday: "#10b981",
};

export interface AppSettings {
  itemTypeColors: Record<WeeklyItemType, string>;
  locationEnabled: boolean;
}

interface AppSettingsContextValue {
  settings: AppSettings;
  setItemTypeColor: (type: WeeklyItemType, color: string) => void;
  setLocationEnabled: (enabled: boolean) => void;
}

const AppSettingsContext = createContext<AppSettingsContextValue | null>(null);

const DEFAULT_SETTINGS: AppSettings = {
  itemTypeColors: DEFAULT_ITEM_TYPE_COLORS,
  locationEnabled: true,
};

interface AppSettingsProviderProps {
  children: ReactNode;
}

export function AppSettingsProvider({ children }: AppSettingsProviderProps) {
  const [settings, setSettings] = useState<AppSettings>(() => {
    if (typeof window === "undefined") return DEFAULT_SETTINGS;
    const saved = localStorage.getItem("app_settings_v1");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Sanitize: only keep known keys from DEFAULT_SETTINGS
        const sanitized = { ...DEFAULT_SETTINGS };
        if (parsed.itemTypeColors) sanitized.itemTypeColors = parsed.itemTypeColors;
        if (typeof parsed.locationEnabled === "boolean") sanitized.locationEnabled = parsed.locationEnabled;
        // Note: taskDetailsSaveMode was removed - now always uses manual save
        return sanitized;
      } catch (e) {
        console.error("Failed to parse app settings", e);
      }
    }
    return DEFAULT_SETTINGS;
  });

  const setSettingsAndPersist = useCallback((updater: (prev: AppSettings) => AppSettings) => {
    setSettings((prev) => {
      const next = updater(prev);
      localStorage.setItem("app_settings_v1", JSON.stringify(next));
      return next;
    });
  }, []);

  const setItemTypeColor = useCallback((type: WeeklyItemType, color: string) => {
    setSettingsAndPersist((prev) => ({
      ...prev,
      itemTypeColors: {
        ...prev.itemTypeColors,
        [type]: color,
      },
    }));
  }, [setSettingsAndPersist]);

  const setLocationEnabled = useCallback((enabled: boolean) => {
    setSettingsAndPersist((prev) => ({
      ...prev,
      locationEnabled: enabled,
    }));
  }, [setSettingsAndPersist]);

  return (
    <AppSettingsContext.Provider
      value={{ settings, setItemTypeColor, setLocationEnabled }}
    >
      {children}
    </AppSettingsContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAppSettings(): AppSettings {
  const context = useContext(AppSettingsContext);
  if (!context) {
    throw new Error("useAppSettings must be used within an AppSettingsProvider");
  }
  return context.settings;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useSetAppSettings() {
  const context = useContext(AppSettingsContext);
  if (!context) {
    throw new Error("useSetAppSettings must be used within an AppSettingsProvider");
  }
  return {
    setItemTypeColor: context.setItemTypeColor,
    setLocationEnabled: context.setLocationEnabled,
  };
}

// eslint-disable-next-line react-refresh/only-export-components
export function getItemTypeColor(
  type: WeeklyItemType,
  settings: AppSettings
): string {
  return settings.itemTypeColors[type] ?? DEFAULT_ITEM_TYPE_COLORS[type];
}

// Vite specific hot module replacement - prevent context from being hot reloaded
if (import.meta.hot) {
  import.meta.hot.accept();
}
