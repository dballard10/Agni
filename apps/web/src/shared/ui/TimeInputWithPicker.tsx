import React, { useRef, useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { IconClock, IconX } from "@tabler/icons-react";
import { useAnchoredMenu } from "@/shared/hooks/useAnchoredMenu";
import { useClickOutside } from "@/shared/hooks/useClickOutside";

interface TimeInputWithPickerProps {
  value: string; // 24h HH:mm
  onChange: (value: string) => void;
  className?: string;
  placeholder?: string;
}

export default function TimeInputWithPicker({
  value,
  onChange,
  className,
  placeholder = "HH:mm",
}: TimeInputWithPickerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const { isOpen, position, toggle, close } = useAnchoredMenu({
    resolveAnchor: () => containerRef.current,
    menuWidth: 200,
    gap: 4,
  });

  useClickOutside([containerRef, menuRef], close, isOpen);

  // Convert HH:mm to 12h format for display
  const getDisplayValue = (val: string) => {
    if (!val) return "";
    const [hStr, mStr] = val.split(":");
    let h = parseInt(hStr, 10);
    const m = mStr;
    const period = h >= 12 ? "PM" : "AM";
    h = h % 12;
    if (h === 0) h = 12;
    return `${h}:${m} ${period}`;
  };

  // Internal state for the picker
  const [h12, setH12] = useState(12);
  const [minutes, setMinutes] = useState("00");
  const [period, setPeriod] = useState<"AM" | "PM">("AM");

  useEffect(() => {
    if (value) {
      const [hStr, mStr] = value.split(":");
      let h = parseInt(hStr, 10);
      // eslint-disable-next-line react-hooks/set-state-in-effect -- sync picker with value
      setPeriod(h >= 12 ? "PM" : "AM");
      h = h % 12;
      if (h === 0) h = 12;
       
      setH12(h);
       
      setMinutes(mStr);
    }
  }, [value, isOpen]);

  const handleSelect = (newH: number, newM: string, newP: "AM" | "PM") => {
    let h24 = newH % 12;
    if (newP === "PM") h24 += 12;
    const hStr = h24.toString().padStart(2, "0");
    onChange(`${hStr}:${newM}`);
  };

  const hours = Array.from({ length: 12 }, (_, i) => i + 1);
  const minuteOptions = ["00", "05", "10", "15", "20", "25", "30", "35", "40", "45", "50", "55"];

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if ((e.key === "Backspace" || e.key === "Delete") && value) {
      e.preventDefault();
      onChange("");
      close();
    }
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange("");
    close();
  };

  return (
    <div ref={containerRef} className="relative flex items-center w-full group">
      <input
        type="text"
        readOnly
        value={getDisplayValue(value)}
        onClick={toggle}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className={`${className} w-full cursor-pointer caret-transparent pr-10`}
      />
      <div className="absolute right-3 text-slate-400 flex items-center justify-center">
        {value ? (
          <button
            type="button"
            onClick={handleClear}
            className="opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity hover:text-slate-200"
            aria-label="Clear time"
          >
            <IconX size={16} />
          </button>
        ) : null}
        <div className={value ? "group-hover:hidden" : ""}>
          <IconClock size={16} className="pointer-events-none" />
        </div>
      </div>

      {isOpen &&
        position &&
        createPortal(
          <div
            ref={menuRef}
            className="fixed z-[100] bg-slate-900 border border-slate-700 rounded-lg shadow-2xl p-2 flex gap-1 h-48 overflow-hidden"
            style={{ top: position.top, left: position.left }}
          >
            {/* Hours */}
            <div className="flex-1 overflow-y-auto scrollbar-hide">
              {hours.map((h) => (
                <button
                  key={h}
                  onClick={() => {
                    setH12(h);
                    handleSelect(h, minutes, period);
                  }}
                  className={`w-full py-1.5 text-sm rounded ${
                    h12 === h
                      ? "bg-blue-600 text-white font-bold"
                      : "text-slate-300 hover:bg-slate-800"
                  }`}
                >
                  {h}
                </button>
              ))}
            </div>

            {/* Minutes */}
            <div className="flex-1 overflow-y-auto scrollbar-hide">
              {minuteOptions.map((m) => (
                <button
                  key={m}
                  onClick={() => {
                    setMinutes(m);
                    handleSelect(h12, m, period);
                  }}
                  className={`w-full py-1.5 text-sm rounded ${
                    minutes === m
                      ? "bg-blue-600 text-white font-bold"
                      : "text-slate-300 hover:bg-slate-800"
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>

            {/* Period */}
            <div className="flex flex-col">
              {(["AM", "PM"] as const).map((p) => (
                <button
                  key={p}
                  onClick={() => {
                    setPeriod(p);
                    handleSelect(h12, minutes, p);
                  }}
                  className={`px-3 py-1.5 text-sm rounded ${
                    period === p
                      ? "bg-blue-600 text-white font-bold"
                      : "text-slate-300 hover:bg-slate-800"
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
