import type { GoalAccentColor } from "../../../entities/goal/model/goalStyles";
import { GOAL_COLOR_OPTIONS } from "../../../entities/goal/model/goalStyles";

interface GoalColorSelectProps {
  value: GoalAccentColor;
  onChange: (color: GoalAccentColor) => void;
  label?: string;
}

export default function GoalColorSelect({
  value,
  onChange,
}: GoalColorSelectProps) {
  return (
    <div>
      <div className="mt-1 flex items-center gap-3">
        <span
          aria-hidden="true"
          className="block h-10 w-10 rounded-lg border border-slate-700 shadow-inner"
          style={{ backgroundColor: value }}
        />
        <select
          value={value}
          onChange={(event) => onChange(event.target.value as GoalAccentColor)}
          className="flex-1 rounded-xl bg-slate-900 border border-slate-700 px-3 py-2 text-sm text-slate-100 focus:border-indigo-500 focus:outline-none"
        >
          {GOAL_COLOR_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
