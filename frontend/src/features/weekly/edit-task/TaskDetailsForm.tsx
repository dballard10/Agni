import { useEffect, useState, useRef, useCallback } from "react";
import type { ReactNode } from "react";
import {
  IconClock,
  IconMapPin,
  IconRepeat,
  IconAlignLeft,
  IconExternalLink,
  IconLoader2,
} from "@tabler/icons-react";
import { LinksEditor } from "./LinksEditor";
import { TASK_SECTION_DIVIDER } from "./taskDetailsStyles";
import DateInputWithPicker from "../../../shared/ui/DateInputWithPicker";
import TimeInputWithPicker from "../../../shared/ui/TimeInputWithPicker";
import RecurrenceSelector from "../recurrence/RecurrenceSelector";
import { getScheduleEndErrors } from "../../../shared/lib/date";
import type { ScheduleValues } from "../../../shared/lib/date";
import type { TaskLocation, RecurrenceFrequency } from "../../../shared/types/weekly";
import {
  searchPlaces,
  suggestionToTaskLocation,
  requestGeolocation,
  type PlaceSuggestion,
} from "../../../shared/lib/places/nominatim";
import { useAppSettings } from "../../../shared/context/AppSettingsContext";

interface TaskDetailsFormValues {
  startDate?: string | null;
  endDate?: string | null;
  startTime?: string | null;
  endTime?: string | null;
  notesMarkdown?: string;
  location?: TaskLocation;
  people?: string;
  goals?: string;
  linksMarkdown?: string;
  recurrenceFrequency?: RecurrenceFrequency | "none";
  recurrenceInterval?: number;
}

interface TaskDetailsFormProps {
  initialValues?: TaskDetailsFormValues;
  onChange?: (values: TaskDetailsFormValues) => void;
  onLocationChange?: (location?: TaskLocation) => void;
  renderLinking?: () => ReactNode;
}

export default function TaskDetailsForm({
  initialValues,
  onChange,
  onLocationChange,
  renderLinking,
}: TaskDetailsFormProps) {
  const settings = useAppSettings();

  // Local state for form fields
  const [startDate, setStartDate] = useState(initialValues?.startDate || "");
  const [endDate, setEndDate] = useState(initialValues?.endDate || "");
  const [startTime, setStartTime] = useState(initialValues?.startTime || "");
  const [endTime, setEndTime] = useState(initialValues?.endTime || "");
  const [notesMarkdown, setNotesMarkdown] = useState(
    initialValues?.notesMarkdown || ""
  );
  const [people, setPeople] = useState(initialValues?.people || "");
  const [goals, setGoals] = useState(initialValues?.goals || "");
  const [linksMarkdown, setLinksMarkdown] = useState(
    initialValues?.linksMarkdown || ""
  );
  const [recurrenceFrequency, setRecurrenceFrequency] = useState<
    RecurrenceFrequency | "none"
  >(initialValues?.recurrenceFrequency || "none");
  const [recurrenceInterval, setRecurrenceInterval] = useState<number>(
    initialValues?.recurrenceInterval || 1
  );

  // Schedule error state
  const [endDateError, setEndDateError] = useState(false);
  const [endTimeError, setEndTimeError] = useState(false);

  // Track last valid schedule for propagation
  const lastValidScheduleRef = useRef<ScheduleValues>({
    startDate: initialValues?.startDate,
    endDate: initialValues?.endDate,
    startTime: initialValues?.startTime,
    endTime: initialValues?.endTime,
  });

  // Location state
  const [locationData, setLocationData] = useState<TaskLocation | undefined>(
    initialValues?.location
  );
  const [locationQuery, setLocationQuery] = useState(
    initialValues?.location?.label || ""
  );
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(-1);
  const [userPosition, setUserPosition] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const lastSearchQueryRef = useRef("");
  const lastSearchUsedPositionRef = useRef(false);

  // Refs
  const abortControllerRef = useRef<AbortController | null>(null);
  const debounceTimeoutRef = useRef<number | null>(null);
  const locationInputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLUListElement>(null);

  // Helper to handle changes and notify parent if needed
  const handleChange = useCallback(
    (field: string, value: string) => {
      let nextStartDate = startDate;
      let nextEndDate = endDate;
      let nextStartTime = startTime;
      let nextEndTime = endTime;

      // Update local state based on field
      switch (field) {
        case "startDate":
          setStartDate(value);
          nextStartDate = value;
          break;
        case "endDate":
          setEndDate(value);
          nextEndDate = value;
          break;
        case "startTime":
          setStartTime(value);
          nextStartTime = value;
          break;
        case "endTime":
          setEndTime(value);
          nextEndTime = value;
          break;
        case "notesMarkdown":
          setNotesMarkdown(value);
          break;
        case "people":
          setPeople(value);
          break;
        case "goals":
          setGoals(value);
          break;
        case "linksMarkdown":
          setLinksMarkdown(value);
          break;
        case "recurrenceFrequency":
          setRecurrenceFrequency(value as RecurrenceFrequency | "none");
          break;
        case "recurrenceInterval":
          setRecurrenceInterval(typeof value === "string" ? parseInt(value) || 1 : value);
          break;
      }

      // Recompute validity
      const currentSchedule: ScheduleValues = {
        startDate: nextStartDate,
        endDate: nextEndDate,
        startTime: nextStartTime,
        endTime: nextEndTime,
      };

      const { endDateError: nextEndDateError, endTimeError: nextEndTimeError } = getScheduleEndErrors(currentSchedule);
      setEndDateError(nextEndDateError);
      setEndTimeError(nextEndTimeError);

      const isInvalid = nextEndDateError || nextEndTimeError;

      if (!isInvalid) {
        lastValidScheduleRef.current = currentSchedule;
      }

      // Notify parent
      if (onChange) {
        // If schedule is valid, use current values. 
        // If invalid, use the last known valid schedule values for propagation.
        const scheduleToPropagate = isInvalid ? lastValidScheduleRef.current : currentSchedule;

        onChange({
          startDate: scheduleToPropagate.startDate,
          endDate: scheduleToPropagate.endDate,
          startTime: scheduleToPropagate.startTime,
          endTime: scheduleToPropagate.endTime,
          notesMarkdown: field === "notesMarkdown" ? value : notesMarkdown,
          location: locationData,
          people: field === "people" ? value : people,
          goals: field === "goals" ? value : goals,
          linksMarkdown: field === "linksMarkdown" ? value : linksMarkdown,
          recurrenceFrequency:
            field === "recurrenceFrequency"
              ? (value as RecurrenceFrequency | "none")
              : recurrenceFrequency,
          recurrenceInterval:
            field === "recurrenceInterval"
              ? (typeof value === "string" ? parseInt(value) || 1 : value)
              : recurrenceInterval,
        });
      }
    },
    [
      onChange,
      startDate,
      endDate,
      startTime,
      endTime,
      notesMarkdown,
      locationData,
      people,
      goals,
      linksMarkdown,
      recurrenceFrequency,
      recurrenceInterval,
    ]
  );

  // Location autocomplete handlers
  const performSearch = useCallback(
    async (query: string) => {
      if (!query.trim()) {
        setSuggestions([]);
        setIsDropdownOpen(false);
        return;
      }

      // Cancel any in-flight request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      const controller = new AbortController();
      abortControllerRef.current = controller;

      setIsSearching(true);
      lastSearchQueryRef.current = query;
      lastSearchUsedPositionRef.current = Boolean(userPosition);

      try {
        const results = await searchPlaces(query, {
          signal: controller.signal,
          lat: userPosition?.lat,
          lng: userPosition?.lng,
          limit: 5,
        });

        setSuggestions(results);
        setHighlightIndex(-1);
        setIsDropdownOpen(results.length > 0);
      } catch (err) {
        if ((err as Error).name !== "AbortError") {
          console.error("Location search failed:", err);
        }
      } finally {
        setIsSearching(false);
      }
    },
    [userPosition]
  );

  const handleLocationInputChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = e.target.value;
    setLocationQuery(value);

    // Clear selected location when user starts typing again
    if (locationData) {
      setLocationData(undefined);
      onLocationChange?.(undefined);
    }

    // Debounce the search
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    debounceTimeoutRef.current = window.setTimeout(() => {
      performSearch(value);
    }, 300);
  };

  const handleLocationFocus = () => {
    // Request geolocation on first focus (only if location is enabled in settings)
    if (!userPosition && settings.locationEnabled) {
      requestGeolocation().then((pos) => {
        if (pos) {
          setUserPosition(pos);
        }
      });
    }

    // Show dropdown if we have suggestions
    if (suggestions.length > 0) {
      setIsDropdownOpen(true);
    }
  };

  useEffect(() => {
    if (
      !settings.locationEnabled ||
      !userPosition ||
      !locationQuery.trim() ||
      lastSearchUsedPositionRef.current ||
      lastSearchQueryRef.current !== locationQuery
    ) {
      return;
    }

    performSearch(locationQuery);
  }, [locationQuery, performSearch, settings.locationEnabled, userPosition]);

  const handleLocationBlur = (e: React.FocusEvent) => {
    // Delay closing to allow click on suggestion
    const relatedTarget = e.relatedTarget as HTMLElement;
    if (dropdownRef.current?.contains(relatedTarget)) {
      return;
    }

    setTimeout(() => {
      setIsDropdownOpen(false);
    }, 150);
  };

  const selectSuggestion = (suggestion: PlaceSuggestion) => {
    const taskLocation = suggestionToTaskLocation(suggestion);
    setLocationData(taskLocation);
    setLocationQuery(taskLocation.label);
    setSuggestions([]);
    setIsDropdownOpen(false);
    setHighlightIndex(-1);
    onLocationChange?.(taskLocation);
  };

  const handleLocationKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isDropdownOpen || suggestions.length === 0) {
      return;
    }

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setHighlightIndex((prev) =>
          prev < suggestions.length - 1 ? prev + 1 : 0
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setHighlightIndex((prev) =>
          prev > 0 ? prev - 1 : suggestions.length - 1
        );
        break;
      case "Enter":
        e.preventDefault();
        if (highlightIndex >= 0 && highlightIndex < suggestions.length) {
          selectSuggestion(suggestions[highlightIndex]);
        }
        break;
      case "Escape":
        e.preventDefault();
        setIsDropdownOpen(false);
        setHighlightIndex(-1);
        break;
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div className="flex flex-col gap-6">
      {/* Notes Section */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center gap-2 text-slate-100 font-medium mb-1.5">
          <IconAlignLeft size={18} className="text-purple-400" />
          <h3>Notes</h3>
        </div>
        <textarea
          value={notesMarkdown}
          onChange={(e) => handleChange("notesMarkdown", e.target.value)}
          placeholder="Add notes or details..."
          rows={4}
          className="bg-slate-800 border border-slate-700 rounded px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-colors resize-y min-h-[100px]"
        />
      </div>

      <div className={TASK_SECTION_DIVIDER} />

      {/* Schedule Section */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2 text-slate-100 font-medium">
          <IconClock size={18} className="text-blue-400" />
          <h3>Schedule</h3>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-slate-400">Start Date</label>
            <DateInputWithPicker
              value={startDate}
              onChange={(value) => handleChange("startDate", value)}
              className="bg-slate-800 border border-slate-700 rounded px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-colors"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-slate-400">End Date</label>
            <DateInputWithPicker
              value={endDate}
              onChange={(value) => handleChange("endDate", value)}
              className={`bg-slate-800 border rounded px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-2 transition-colors ${
                endDateError
                  ? "border-red-500 focus:ring-red-500/50 focus:border-red-500"
                  : "border-slate-700 focus:ring-blue-500/50 focus:border-blue-500"
              }`}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-slate-400">Start Time</label>
            <TimeInputWithPicker
              value={startTime}
              onChange={(value) => handleChange("startTime", value)}
              className="bg-slate-800 border border-slate-700 rounded px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-colors"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-slate-400">End Time</label>
            <TimeInputWithPicker
              value={endTime}
              onChange={(value) => handleChange("endTime", value)}
              className={`bg-slate-800 border rounded px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-2 transition-colors ${
                endTimeError
                  ? "border-red-500 focus:ring-red-500/50 focus:border-red-500"
                  : "border-slate-700 focus:ring-blue-500/50 focus:border-blue-500"
              }`}
            />
          </div>
        </div>

        {(endDateError || endTimeError) && (
          <p className="text-[10px] text-red-400 font-medium">
            {endDateError ? "End date can't be before start date" : "End time can't be before start time"}
          </p>
        )}

        {/* Repeating Section */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2 text-slate-400">
            <IconRepeat size={16} />
            <span className="text-sm">Repeating</span>
          </div>

          <div className="w-full">
            <RecurrenceSelector
              frequency={recurrenceFrequency}
              interval={recurrenceInterval}
              onChange={(f, i) => {
                // Update frequency first
                setRecurrenceFrequency(f);
                setRecurrenceInterval(i);

                // Notify parent
                if (onChange) {
                  onChange({
                    startDate,
                    endDate,
                    startTime,
                    endTime,
                    notesMarkdown,
                    location: locationData,
                    people,
                    goals,
                    linksMarkdown,
                    recurrenceFrequency: f,
                    recurrenceInterval: i,
                  });
                }
              }}
            />
          </div>
        </div>
      </div>

      {renderLinking ? (
        <>
          <div className={TASK_SECTION_DIVIDER} />
          {renderLinking()}
        </>
      ) : (
        <div className={TASK_SECTION_DIVIDER} />
      )}

      {/* Details/Context Section */}
      <div className="flex flex-col gap-6">
        {/* Location Section */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-2 text-slate-100 font-medium mb-1.5">
            <IconMapPin size={18} className="text-rose-400" />
            <h3>Location</h3>
          </div>
          <div className="flex flex-col gap-1.5">
            <div className="relative">
              <input
                ref={locationInputRef}
                type="text"
                value={locationQuery}
                onChange={handleLocationInputChange}
                onFocus={handleLocationFocus}
                onBlur={handleLocationBlur}
                onKeyDown={handleLocationKeyDown}
                placeholder="Search for a place..."
                autoComplete="off"
                role="combobox"
                aria-expanded={isDropdownOpen}
                aria-controls="location-listbox"
                aria-activedescendant={
                  highlightIndex >= 0
                    ? `location-option-${highlightIndex}`
                    : undefined
                }
                className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-400/50 focus:border-rose-400 transition-colors pr-8"
              />
              {isSearching && (
                <div className="absolute right-2 top-1/2 -translate-y-1/2">
                  <IconLoader2 size={16} className="text-slate-400 animate-spin" />
                </div>
              )}

              {/* Suggestions Dropdown */}
              {isDropdownOpen && suggestions.length > 0 && (
                <ul
                  ref={dropdownRef}
                  id="location-listbox"
                  role="listbox"
                  className="absolute z-50 left-0 right-0 top-full mt-1 bg-slate-800 border border-slate-700 rounded-md shadow-lg max-h-60 overflow-auto"
                >
                  {suggestions.map((suggestion, index) => (
                    <li
                      key={suggestion.id}
                      id={`location-option-${index}`}
                      role="option"
                      aria-selected={index === highlightIndex}
                      onClick={() => selectSuggestion(suggestion)}
                      onMouseEnter={() => setHighlightIndex(index)}
                      className={`px-3 py-2 cursor-pointer text-sm transition-colors ${
                        index === highlightIndex
                          ? "bg-rose-400/20 text-slate-100"
                          : "text-slate-300 hover:bg-slate-700/50"
                      }`}
                    >
                      <div className="font-medium truncate">{suggestion.label}</div>
                      {suggestion.secondaryLabel && (
                        <div className="text-xs text-slate-500 truncate">
                          {suggestion.secondaryLabel}
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Open Map Link */}
            {locationData?.mapUrl && (
              <a
                href={locationData.mapUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-purple-400 hover:text-purple-300 transition-colors w-fit"
              >
                <IconExternalLink size={12} />
                Open in Maps
              </a>
            )}
          </div>
        </div>

          <div className={TASK_SECTION_DIVIDER} />

        {/* Links Section */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-2 text-slate-100 font-medium mb-1.5">
            <IconExternalLink size={18} className="text-teal-400" />
            <h3>Links</h3>
          </div>
          <LinksEditor
            linksMarkdown={linksMarkdown}
            onChange={(next) => handleChange("linksMarkdown", next)}
          />
        </div>
      </div>
    </div>
  );
}
