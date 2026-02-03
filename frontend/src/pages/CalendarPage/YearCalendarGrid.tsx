import {
  format,
  eachMonthOfInterval,
  startOfYear,
  endOfYear,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isToday,
} from "date-fns";
import type { CalendarEvent } from "../../shared/types/calendar";
import { ITEM_TYPE_PRIORITIES } from "../../entities/task/model/itemTypeConfig";
import { useAppSettings, type AppSettings } from "../../shared/context/AppSettingsContext";

interface YearCalendarGridProps {
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
  events: CalendarEvent[];
}

export function YearCalendarGrid({
  selectedDate,
  onDateSelect,
  events,
}: YearCalendarGridProps) {
  const settings = useAppSettings();
  const yearStart = startOfYear(selectedDate);
  const yearEnd = endOfYear(selectedDate);
  const months = eachMonthOfInterval({ start: yearStart, end: yearEnd });

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {months.map((month) => (
        <MiniMonth
          key={month.toISOString()}
          month={month}
          selectedDate={selectedDate}
          onDateSelect={onDateSelect}
          events={events}
          settings={settings}
        />
      ))}
    </div>
  );
}

export default YearCalendarGrid;

function MiniMonth({
  month,
  selectedDate,
  onDateSelect,
  events,
  settings,
}: {
  month: Date;
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
  events: CalendarEvent[];
  settings: AppSettings;
}) {
  const monthStart = startOfMonth(month);
  const monthEnd = endOfMonth(month);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);

  const days = eachDayOfInterval({ start: startDate, end: endDate });
  const weekDays = ["S", "M", "T", "W", "T", "F", "S"];

  return (
    <div className="bg-slate-900/50 p-4 rounded-lg border border-slate-800 flex flex-col h-full">
      <h3 className="font-semibold text-slate-200 mb-3 ml-1">
        {format(month, "MMMM")}
      </h3>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 mb-2">
        {weekDays.map((d, i) => (
          <div
            key={i}
            className="text-center text-xs text-slate-500 font-medium"
          >
            {d}
          </div>
        ))}
      </div>

      {/* Days grid */}
      <div className="grid grid-cols-7 gap-y-2">
        {days.map((day) => {
          const isCurrentMonth = isSameMonth(day, month);
          const isSelected = isSameDay(day, selectedDate);
          const isTodayDate = isToday(day);

          // Simple event check
          const dayEvents = events.filter(
            (e) => e.start === format(day, "yyyy-MM-dd")
          );
          const hasEvents = dayEvents.length > 0;
          const primaryType = ITEM_TYPE_PRIORITIES.find((type) =>
            dayEvents.some((event) => event.type === type)
          );
          const dotColor = primaryType
            ? settings.itemTypeColors[primaryType]
            : settings.itemTypeColors.task;

          return (
            <button
              key={day.toISOString()}
              onClick={() => onDateSelect(day)}
              className={`
                relative h-8 w-8 mx-auto flex items-center justify-center text-sm rounded-full transition-colors
                ${!isCurrentMonth ? "text-slate-700" : "text-slate-300"}
                ${
                  isSelected
                    ? "bg-indigo-600 text-white font-semibold"
                    : "hover:bg-slate-800"
                }
                ${
                  isTodayDate && !isSelected
                    ? "ring-1 ring-indigo-500 text-indigo-400"
                    : ""
                }
              `}
            >
              {format(day, "d")}
              {hasEvents && !isSelected && (
                <span
                  className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full"
                  style={{ backgroundColor: dotColor }}
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
