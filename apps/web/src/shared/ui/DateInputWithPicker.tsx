import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
} from "date-fns";
import { IconCalendar, IconChevronLeft, IconChevronRight } from "@tabler/icons-react";
import { useAnchoredMenu } from "@/shared/hooks/useAnchoredMenu";
import { useClickOutside } from "@/shared/hooks/useClickOutside";

interface DateInputWithPickerProps {
  value: string; // ISO YYYY-MM-DD
  onChange: (value: string) => void;
  className?: string;
  placeholder?: string;
}

export default function DateInputWithPicker({
  value,
  onChange,
  className,
  placeholder,
}: DateInputWithPickerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const { isOpen, position, toggle, close } = useAnchoredMenu({
    resolveAnchor: () => containerRef.current,
    menuWidth: 280,
    gap: 4,
  });

  useClickOutside([containerRef, menuRef], close, isOpen);

  const parseValueDate = (dateValue: string) => {
    if (!dateValue) return null;
    return new Date(`${dateValue}T00:00:00`);
  };

  const [viewDate, setViewDate] = useState(() => parseValueDate(value) ?? new Date());
  const [draftDate, setDraftDate] = useState<Date | null>(() => parseValueDate(value));
  const [mode, setMode] = useState<"day" | "year">("day");
  const yearListRef = useRef<HTMLDivElement>(null);

  // Sync viewDate and draftDate when menu opens
  useEffect(() => {
    if (!isOpen) return;
    const initialDate = parseValueDate(value);
    // eslint-disable-next-line react-hooks/set-state-in-effect -- sync on open
    setViewDate(initialDate ?? new Date());
     
    setDraftDate(initialDate ?? new Date());
     
    setMode("day");
  }, [isOpen, value]);

  const handleDateSelect = (date: Date) => {
    setDraftDate(date);
  };

  const handlePrevMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    setViewDate((prev) => subMonths(prev, 1));
  };

  const handleNextMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    setViewDate((prev) => addMonths(prev, 1));
  };

  const handleCancel = () => {
    close();
  };

  const handleConfirm = () => {
    onChange(draftDate ? format(draftDate, "yyyy-MM-dd") : "");
    close();
  };

  const handleClear = () => {
    setDraftDate(null);
  };

  const handleYearSelect = (year: number) => {
    const baseDate = draftDate ?? new Date();
    const nextDate = new Date(baseDate);
    nextDate.setFullYear(year);
    setDraftDate(nextDate);
    setViewDate(nextDate);
    setMode("day");
  };

  const monthStart = startOfMonth(viewDate);
  const monthEnd = endOfMonth(viewDate);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);
  const days = eachDayOfInterval({ start: startDate, end: endDate });

  const weekDays = ["S", "M", "T", "W", "T", "F", "S"];
  const displayValue = value ? format(new Date(`${value}T00:00:00`), "MM/dd/yyyy") : "";
  const displayHeading = draftDate ? format(draftDate, "EEE, MMM d") : "Select a date";
  const displayYear = draftDate ? format(draftDate, "yyyy") : format(viewDate, "yyyy");
  const displayYearNumber = parseInt(displayYear, 10);
  const inputClassName = [className, "w-full pr-10"].filter(Boolean).join(" ");
  const yearRangeStart = displayYearNumber - 50;
  const yearRangeEnd = displayYearNumber + 50;
  const years = Array.from(
    { length: yearRangeEnd - yearRangeStart + 1 },
    (_, idx) => yearRangeStart + idx
  );

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        close();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, close]);

  useEffect(() => {
    if (mode !== "year") return;
    const yearButton = yearListRef.current?.querySelector<HTMLButtonElement>(
      `[data-year="${displayYearNumber}"]`
    );
    yearButton?.scrollIntoView({ block: "center" });
  }, [mode, displayYearNumber]);

  return (
    <div ref={containerRef} className="relative flex items-center w-full">
      <input
        type="text"
        value={displayValue}
        onClick={toggle}
        readOnly
        className={inputClassName}
        placeholder={placeholder}
        spellCheck={false}
        autoComplete="off"
      />
      <button
        ref={triggerRef}
        type="button"
        onClick={toggle}
        className="absolute right-2 p-1 text-slate-400 hover:text-slate-200 transition-colors"
        aria-label="Open calendar"
      >
        <IconCalendar size={18} />
      </button>

      {isOpen &&
        position &&
        createPortal(
          <div
            ref={menuRef}
            className="fixed z-[100] bg-slate-900 border border-slate-700 rounded-lg shadow-2xl w-[300px] overflow-hidden"
            style={{ top: position.top, left: position.left }}
          >
            {/* Header */}
            <div className="bg-indigo-600 px-4 py-3 text-white">
              <div className="text-[10px] uppercase tracking-widest text-white/70">
                Select date
              </div>
              <div className="text-xl font-semibold">{displayHeading}</div>
              <button
                type="button"
                onClick={() => setMode((current) => (current === "year" ? "day" : "year"))}
                className="text-sm text-white/80 hover:text-white transition-colors"
              >
                {displayYear}
              </button>
            </div>

            <div className="p-4 space-y-3">
              {mode === "year" ? (
                <div
                  ref={yearListRef}
                  className="max-h-64 overflow-y-auto rounded border border-slate-800"
                >
                  <div className="grid grid-cols-3 gap-2 p-2">
                    {years.map((year) => {
                      const isSelected = year === displayYearNumber;
                      return (
                        <button
                          key={year}
                          type="button"
                          data-year={year}
                          onClick={() => handleYearSelect(year)}
                          className={`rounded px-2 py-2 text-xs font-semibold transition-colors ${
                            isSelected
                              ? "bg-indigo-500 text-white"
                              : "text-slate-300 hover:bg-slate-800"
                          }`}
                        >
                          {year}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between">
                    <button
                      onClick={handlePrevMonth}
                      className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-slate-100 transition-colors"
                    >
                      <IconChevronLeft size={18} />
                    </button>
                    <h4 className="font-semibold text-slate-200">
                      {format(viewDate, "MMMM yyyy")}
                    </h4>
                    <button
                      onClick={handleNextMonth}
                      className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-slate-100 transition-colors"
                    >
                      <IconChevronRight size={18} />
                    </button>
                  </div>

                  {/* Weekdays */}
                  <div className="grid grid-cols-7">
                    {weekDays.map((d, i) => (
                      <div
                        key={i}
                        className="text-center text-[10px] text-slate-500 font-bold uppercase"
                      >
                        {d}
                      </div>
                    ))}
                  </div>

                  {/* Days Grid */}
                  <div className="grid grid-cols-7 gap-1">
                    {days.map((day) => {
                      const isCurrentMonth = isSameMonth(day, viewDate);
                      const isSelected = draftDate ? isSameDay(day, draftDate) : false;
                      const isToday = isSameDay(day, new Date());

                      return (
                        <button
                          key={day.toISOString()}
                          onClick={() => handleDateSelect(day)}
                          className={`
                            h-8 w-8 flex items-center justify-center text-xs rounded-full transition-colors
                            ${!isCurrentMonth ? "text-slate-700" : "text-slate-300"}
                            ${
                              isSelected
                                ? "bg-indigo-500 text-white font-bold"
                                : "hover:bg-slate-800"
                            }
                            ${
                              isToday && !isSelected
                                ? "ring-1 ring-indigo-400 text-indigo-300 font-bold"
                                : ""
                            }
                            ${isToday && isSelected ? "font-bold" : ""}
                          `}
                        >
                          {format(day, "d")}
                        </button>
                      );
                    })}
                  </div>
                </>
              )}

              <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={handleClear}
                  className="text-xs font-semibold text-slate-500 hover:text-slate-200 transition-colors"
                >
                  Clear
                </button>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="px-3 py-1.5 text-xs font-semibold text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirm}
                    className="px-3 py-1.5 text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white rounded transition-colors"
                  >
                    OK
                  </button>
                </div>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
