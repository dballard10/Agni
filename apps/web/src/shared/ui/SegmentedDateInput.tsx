import React, { useState, useEffect, useRef } from "react";

interface SegmentedDateInputProps {
  value: string; // ISO YYYY-MM-DD
  onChange: (value: string) => void;
  className?: string;
  placeholder?: string;
  "aria-label"?: string;
}

/**
 * A custom date input that displays MM/DD/YYYY and handles segment-based editing.
 * Specifically handles the requirement:
 * - If a segment is all zeros, Backspace jumps to the previous segment and zeros it.
 * - Digits fill segments and advance to the next segment automatically.
 */
export default function SegmentedDateInput({
  value,
  onChange,
  className,
  placeholder,
  "aria-label": ariaLabel,
}: SegmentedDateInputProps) {
  const DEFAULT_PLACEHOLDER = "MM/DD/YYYY";
  const TEMPLATE_VALUE = "MM/DD/YYYY";

  const [displayValue, setDisplayValue] = useState(TEMPLATE_VALUE);
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync internal display value with prop value (ISO YYYY-MM-DD)
  useEffect(() => {
    if (isFocused) return;

    if (!value) {
      setDisplayValue(TEMPLATE_VALUE);
      return;
    }

    const parts = value.split("-");
    if (parts.length !== 3) return;

    const [y, m, d] = parts;
    // Basic normalization to ensure we have 2 digits for m/d and 4 for y
    const mm = m.padStart(2, "0");
    const dd = d.padStart(2, "0");
    const yyyy = y.padStart(4, "0");
    setDisplayValue(`${mm}/${dd}/${yyyy}`);
  }, [value, isFocused]);

  const selectSegment = (pos: number) => {
    if (!inputRef.current) return;
    if (pos < 3) {
      inputRef.current.setSelectionRange(0, 2); // Month
    } else if (pos < 6) {
      inputRef.current.setSelectionRange(3, 5); // Day
    } else {
      inputRef.current.setSelectionRange(6, 10); // Year
    }
  };

  const getActiveSegment = (pos: number): "month" | "day" | "year" => {
    if (pos < 3) return "month";
    if (pos < 6) return "day";
    return "year";
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!inputRef.current) return;
    const { selectionStart } = inputRef.current;
    if (selectionStart === null) return;

    const segment = getActiveSegment(selectionStart);

    if (e.key === "Backspace") {
      e.preventDefault();
      const baseValue = displayValue.length === 10 ? displayValue : TEMPLATE_VALUE;
      const chars = baseValue.split("");

      if (segment === "year") {
        const isYearEmpty = baseValue.slice(6, 10) === "YYYY";
        if (isYearEmpty) {
          // If year is already empty, jump to Day, clear it, and select it
          chars[3] = "D";
          chars[4] = "D";
          setDisplayValue(chars.join(""));
          setTimeout(() => selectSegment(3), 0);
        } else {
          // Otherwise, clear the year segment
          chars[6] = "Y";
          chars[7] = "Y";
          chars[8] = "Y";
          chars[9] = "Y";
          setDisplayValue(chars.join(""));
          setTimeout(() => selectSegment(6), 0);
        }
      } else if (segment === "day") {
        const isDayEmpty = baseValue.slice(3, 5) === "DD";
        if (isDayEmpty) {
          // If day is already empty, jump to Month, clear it, and select it
          chars[0] = "M";
          chars[1] = "M";
          setDisplayValue(chars.join(""));
          setTimeout(() => selectSegment(0), 0);
        } else {
          // Otherwise, clear the day segment
          chars[3] = "D";
          chars[4] = "D";
          setDisplayValue(chars.join(""));
          setTimeout(() => selectSegment(3), 0);
        }
      } else {
        // Month segment - just clear it
        chars[0] = "M";
        chars[1] = "M";
        setDisplayValue(chars.join(""));
        setTimeout(() => selectSegment(0), 0);
      }
      return;
    }

    if (/^\d$/.test(e.key)) {
      e.preventDefault();
      const digit = e.key;
      const baseValue = displayValue.length === 10 ? displayValue : TEMPLATE_VALUE;
      const chars = baseValue.split("");

      if (segment === "month") {
        if (selectionStart === 0) {
          chars[0] = digit;
          setDisplayValue(chars.join(""));
          inputRef.current.setSelectionRange(1, 1);
        } else {
          chars[1] = digit;
          setDisplayValue(chars.join(""));
          setTimeout(() => selectSegment(3), 0); // Advance to day
        }
      } else if (segment === "day") {
        if (selectionStart === 3) {
          chars[3] = digit;
          setDisplayValue(chars.join(""));
          inputRef.current.setSelectionRange(4, 4);
        } else {
          chars[4] = digit;
          setDisplayValue(chars.join(""));
          setTimeout(() => selectSegment(6), 0); // Advance to year
        }
      } else {
        // Year segment
        const yearPos = selectionStart - 6;
        if (yearPos >= 0 && yearPos < 4) {
          chars[6 + yearPos] = digit;
          setDisplayValue(chars.join(""));
          if (yearPos < 3) {
            inputRef.current.setSelectionRange(6 + yearPos + 1, 6 + yearPos + 1);
          } else {
            // After 4th digit of year, keep focus on year segment
            setTimeout(() => selectSegment(6), 0);
          }
        }
      }
      return;
    }

    // Explicit segment navigation with arrows
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      if (segment === "year") selectSegment(3);
      else if (segment === "day") selectSegment(0);
      else selectSegment(0);
      return;
    }
    if (e.key === "ArrowRight") {
      e.preventDefault();
      if (segment === "month") selectSegment(3);
      else if (segment === "day") selectSegment(6);
      else selectSegment(6);
      return;
    }

    // Allow Tab, Enter, etc. to pass through
  };

  const handleBlur = () => {
    setIsFocused(false);

    const baseValue = displayValue.length === 10 ? displayValue : TEMPLATE_VALUE;
    const [m, d, y] = baseValue.split("/");

    // Empty state: show placeholder and store empty
    if (m === "MM" || d === "DD" || y === "YYYY") {
      onChange("");
      setDisplayValue(TEMPLATE_VALUE);
      return;
    }

    // Basic format guard
    const isValidShape =
      /^\d{2}$/.test(m) && /^\d{2}$/.test(d) && /^\d{4}$/.test(y);
    if (!isValidShape) {
      onChange("");
      setDisplayValue(TEMPLATE_VALUE);
      return;
    }

    onChange(`${y}-${m}-${d}`);
  };

  const handleFocus = () => {
    setIsFocused(true);
    if (!displayValue) setDisplayValue(TEMPLATE_VALUE);
    // On focus, default to selecting the month segment
    setTimeout(() => selectSegment(0), 0);
  };

  const handleClick = (_e: React.MouseEvent<HTMLInputElement>) => {
    if (!displayValue) setDisplayValue(TEMPLATE_VALUE);
    // On click, snap selection to the clicked segment
    const pos = inputRef.current?.selectionStart ?? 0;
    selectSegment(pos);
  };

  return (
    <input
      ref={inputRef}
      type="text"
      value={displayValue}
      onChange={() => {}} // Handled by onKeyDown
      onKeyDown={handleKeyDown}
      onFocus={handleFocus}
      onBlur={handleBlur}
      onClick={handleClick}
      className={className}
      placeholder={placeholder ?? DEFAULT_PLACEHOLDER}
      aria-label={ariaLabel}
      spellCheck={false}
      autoComplete="off"
    />
  );
}

