import { useState } from "react";
import type {
  WeekState,
  WeeklyItemType,
  Goal,
  Companion,
} from "../../shared/types/weekly";
import { ITEM_TYPE_STYLES } from "../../entities/task/model/itemTypeConfig";
import {
  useAppSettings,
  useSetAppSettings,
} from "../../shared/context/AppSettingsContext";
import { PageHeader } from "../../widgets/PageHeader";
import {
  IconPalette,
  IconMapPin,
  IconTarget,
  IconUsers,
  IconChevronRight,
  IconAdjustments,
} from "@tabler/icons-react";
import { EditingAndSavingSettingsPage } from "../../features/settings/editing-and-saving/EditingAndSavingSettingsPage";

interface SettingsPageProps {
  weekState: WeekState;
  actions: {
    updateGoal: (id: string, updates: Partial<Omit<Goal, "id" | "createdAt">>) => void;
    updateCompanion: (id: string, updates: Partial<Omit<Companion, "id" | "createdAt">>) => void;
  };
}

const ITEM_TYPES: WeeklyItemType[] = ["task", "event", "birthday", "holiday"];

export default function SettingsPage({ weekState, actions }: SettingsPageProps) {
  const settings = useAppSettings();
  const { setItemTypeColor, setLocationEnabled } = useSetAppSettings();
  const [activeSubpage, setActiveSubpage] = useState<string | null>(null);

  if (activeSubpage === "editing-and-saving") {
    return (
      <div className="flex flex-col min-h-screen pb-12">
        <PageHeader title="Settings" />
        <div className="flex-1 max-w-4xl w-full mx-auto p-4 md:p-6">
          <EditingAndSavingSettingsPage onBack={() => setActiveSubpage(null)} />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen pb-12">
      <PageHeader title="Settings" />

      <div className="flex-1 max-w-4xl w-full mx-auto p-4 md:p-6 space-y-8">
        {/* Navigation to Subpages */}
        <section className="bg-slate-900/50 border border-slate-800 rounded-xl overflow-hidden">
          <button
            onClick={() => setActiveSubpage("editing-and-saving")}
            className="w-full flex items-center justify-between p-5 hover:bg-slate-800/50 transition-colors group"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-slate-800 text-slate-400 group-hover:text-blue-400 transition-colors">
                <IconAdjustments className="w-5 h-5" />
              </div>
              <div className="text-left">
                <h2 className="text-lg font-semibold text-slate-100">Editing and Saving</h2>
                <p className="text-sm text-slate-400">Configure how you edit tasks and how they are saved.</p>
              </div>
            </div>
            <IconChevronRight className="w-5 h-5 text-slate-600 group-hover:text-slate-400 transition-colors" />
          </button>
        </section>

        {/* Location Setting */}
        <SettingsSection
          icon={<IconMapPin className="w-5 h-5 text-sky-400" />}
          title="Location"
          description="Allow the app to access your location for place search suggestions."
        >
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-300">Enable location access</span>
            <ToggleSwitch
              checked={settings.locationEnabled}
              onChange={setLocationEnabled}
            />
          </div>
        </SettingsSection>

        {/* Event Subtype Colors */}
        <SettingsSection
          icon={<IconPalette className="w-5 h-5 text-indigo-400" />}
          title="Event Subtype Colors"
          description="Customize colors for different task and event types."
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {ITEM_TYPES.map((type) => (
              <ColorPickerRow
                key={type}
                label={ITEM_TYPE_STYLES[type].label}
                color={settings.itemTypeColors[type]}
                onChange={(color) => setItemTypeColor(type, color)}
              />
            ))}
          </div>
        </SettingsSection>

        {/* Goal Colors */}
        <SettingsSection
          icon={<IconTarget className="w-5 h-5 text-emerald-400" />}
          title="Goal Colors"
          description="Change colors for your existing goals."
        >
          {weekState.goals.length === 0 ? (
            <p className="text-sm text-slate-500 italic">No goals created yet.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {weekState.goals.map((goal) => (
                <ColorPickerRow
                  key={goal.id}
                  label={`${goal.emoji ?? "🎯"} ${goal.name}`}
                  color={goal.color ?? "#8b5cf6"}
                  onChange={(color) => actions.updateGoal(goal.id, { color })}
                />
              ))}
            </div>
          )}
        </SettingsSection>

        {/* Companion Colors */}
        <SettingsSection
          icon={<IconUsers className="w-5 h-5 text-rose-400" />}
          title="Companion Colors"
          description="Change colors for your existing companions."
        >
          {weekState.companions.length === 0 ? (
            <p className="text-sm text-slate-500 italic">No companions created yet.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {weekState.companions.map((companion) => (
                <ColorPickerRow
                  key={companion.id}
                  label={companion.name}
                  color={companion.color ?? "#64748b"}
                  onChange={(color) => actions.updateCompanion(companion.id, { color })}
                />
              ))}
            </div>
          )}
        </SettingsSection>
      </div>
    </div>
  );
}

// --- Subcomponents ---

interface SettingsSectionProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  children: React.ReactNode;
}

function SettingsSection({ icon, title, description, children }: SettingsSectionProps) {
  return (
    <section className="bg-slate-900/50 border border-slate-800 rounded-xl p-5">
      <div className="flex items-start gap-3 mb-4">
        <div className="mt-0.5">{icon}</div>
        <div>
          <h2 className="text-lg font-semibold text-slate-100">{title}</h2>
          <p className="text-sm text-slate-400">{description}</p>
        </div>
      </div>
      {children}
    </section>
  );
}

interface ColorPickerRowProps {
  label: string;
  color: string;
  onChange: (color: string) => void;
}

function ColorPickerRow({ label, color, onChange }: ColorPickerRowProps) {
  const [localColor, setLocalColor] = useState(color);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newColor = e.target.value;
    setLocalColor(newColor);
    onChange(newColor);
  };

  // Sync local state when prop changes
  if (color !== localColor && !document.activeElement?.closest(`[data-color-label="${label}"]`)) {
    setLocalColor(color);
  }

  return (
    <div
      data-color-label={label}
      className="flex items-center justify-between bg-slate-800/50 border border-slate-700 rounded-lg px-3 py-2"
    >
      <span className="text-sm text-slate-200 truncate pr-2">{label}</span>
      <div className="flex items-center gap-2 flex-shrink-0">
        <input
          type="color"
          value={localColor}
          onChange={handleChange}
          className="w-8 h-8 rounded cursor-pointer border-0 bg-transparent [&::-webkit-color-swatch-wrapper]:p-0 [&::-webkit-color-swatch]:rounded [&::-webkit-color-swatch]:border-slate-600"
        />
        <span className="text-xs font-mono text-slate-400 w-16">
          {localColor.toUpperCase()}
        </span>
      </div>
    </div>
  );
}

interface ToggleSwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
}

function ToggleSwitch({ checked, onChange }: ToggleSwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`
        relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent 
        transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-slate-900
        ${checked ? "bg-indigo-600" : "bg-slate-700"}
      `}
    >
      <span
        className={`
          pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 
          transition duration-200 ease-in-out
          ${checked ? "translate-x-5" : "translate-x-0"}
        `}
      />
    </button>
  );
}
