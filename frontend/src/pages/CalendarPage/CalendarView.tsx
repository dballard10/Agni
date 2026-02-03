import { useState } from "react";
import { format, addYears, subYears, addMonths, subMonths, addWeeks, subWeeks, addDays, subDays } from "date-fns";
import { IconChevronLeft, IconChevronRight } from "@tabler/icons-react";
import type { CalendarViewMode, CalendarEvent } from "../../shared/types/calendar";

import { YearCalendarGrid } from "./YearCalendarGrid";
import BigCalendarShell from "./BigCalendarShell";

interface CalendarViewProps {
  events: CalendarEvent[];
}

export default function CalendarView({ events }: CalendarViewProps) {
  const [viewMode, setViewMode] = useState<CalendarViewMode>("year");
  const [selectedDate, setSelectedDate] = useState(new Date());

  const handlePrevious = () => {
    switch (viewMode) {
      case "year":
        setSelectedDate((d) => subYears(d, 1));
        break;
      case "month":
        setSelectedDate((d) => subMonths(d, 1));
        break;
      case "week":
        setSelectedDate((d) => subWeeks(d, 1));
        break;
      case "day":
        setSelectedDate((d) => subDays(d, 1));
        break;
    }
  };

  const handleNext = () => {
    switch (viewMode) {
      case "year":
        setSelectedDate((d) => addYears(d, 1));
        break;
      case "month":
        setSelectedDate((d) => addMonths(d, 1));
        break;
      case "week":
        setSelectedDate((d) => addWeeks(d, 1));
        break;
      case "day":
        setSelectedDate((d) => addDays(d, 1));
        break;
    }
  };

  const handleToday = () => {
    setSelectedDate(new Date());
  };

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    if (viewMode === "year") {
      setViewMode("day");
    }
  };

  const getHeaderLabel = () => {
    switch (viewMode) {
      case "year":
        return format(selectedDate, "yyyy");
      case "month":
        return format(selectedDate, "MMMM yyyy");
      case "week":
        return `Week of ${format(selectedDate, "MMM d, yyyy")}`;
      case "day":
        return format(selectedDate, "MMMM d, yyyy");
    }
  };

  return (
    <div className="flex flex-col h-full w-full bg-slate-950 text-slate-100">
      {/* Top Bar */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 shrink-0">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold">Calendar</h1>
          
          {/* Navigation */}
          <div className="flex items-center bg-slate-900 rounded-lg p-1 border border-slate-800">
            <button
              onClick={handlePrevious}
              className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-slate-100 transition-colors"
              title="Previous"
            >
              <IconChevronLeft size={20} />
            </button>
            <button
              onClick={handleToday}
              className="px-3 py-1 text-sm font-medium text-slate-300 hover:text-slate-100 transition-colors"
            >
              Today
            </button>
            <button
              onClick={handleNext}
              className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-slate-100 transition-colors"
              title="Next"
            >
              <IconChevronRight size={20} />
            </button>
          </div>

          <span className="text-xl font-semibold min-w-[140px]">
            {getHeaderLabel()}
          </span>
        </div>

        {/* View Switcher */}
        <div className="flex bg-slate-900 rounded-lg p-1 border border-slate-800">
          {(["year", "month", "week", "day"] as CalendarViewMode[]).map((mode) => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className={`px-3 py-1 text-sm font-medium rounded capitalize transition-colors ${
                viewMode === mode
                  ? "bg-slate-800 text-slate-100 shadow-sm"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
              }`}
            >
              {mode}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden p-4">
        {viewMode === "year" ? (
          <div className="h-full overflow-y-auto">
            <YearCalendarGrid 
              selectedDate={selectedDate} 
              onDateSelect={handleDateSelect}
              events={events} 
            />
          </div>
        ) : (
          <BigCalendarShell
            events={events}
            viewMode={viewMode}
            date={selectedDate}
            onNavigate={setSelectedDate}
            onViewChange={setViewMode}
          />
        )}
      </div>
    </div>
  );
}
