"use client";

import { useState, useEffect, useRef } from "react";

type UnitOption = {
  value: string;
  label: string;
};

type Props = {
  selectedUnits: string[];
  onChange: (units: string[]) => void;
  options: UnitOption[];
  placeholder?: string;
};

export default function UnitMultiSelect({
  selectedUnits,
  onChange,
  options,
  placeholder = "단원 선택",
}: Props) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);

  // 바깥 클릭 시 닫기
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [open]);

  const toggleUnit = (unitValue: string) => {
    if (selectedUnits.includes(unitValue)) {
      onChange(selectedUnits.filter((u) => u !== unitValue));
    } else {
      onChange([...selectedUnits, unitValue]);
    }
  };

  const removeUnit = (unitValue: string) => {
    onChange(selectedUnits.filter((u) => u !== unitValue));
  };

  const displayText =
    selectedUnits.length === 0
      ? placeholder
      : `${selectedUnits.length}개 단원 선택됨`;

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="w-full h-12 max-[380px]:h-10 rounded-full bg-white border border-gray-200 hover:bg-sky-50 hover:border-sky-200 px-4 text-sm max-[380px]:text-xs text-left flex items-center justify-between focus:outline-none focus:ring-2 focus:ring-sky-200 transition"
      >
        <span className={selectedUnits.length > 0 ? "text-[#2F2A57] font-semibold" : "text-gray-400"}>
          {displayText}
        </span>
        <svg
          width="18"
          height="18"
          viewBox="0 0 20 20"
          fill="none"
          className={`transition-transform ${open ? "rotate-180" : ""}`}
        >
          <path
            d="M5.25 7.5l4.75 5 4.75-5"
            stroke="currentColor"
            strokeWidth="2"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {/* 드롭다운 */}
      {open && (
        <div className="absolute z-50 mt-2 w-full rounded-2xl border border-sky-200/60 bg-sky-50/80 backdrop-blur-sm shadow-lg overflow-hidden">
          <div className="max-h-60 overflow-auto">
            {options.map((option) => {
              const isSelected = selectedUnits.includes(option.value);
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => toggleUnit(option.value)}
                  className={`w-full px-4 py-3 text-sm max-[380px]:text-xs text-slate-700 text-left transition flex items-center gap-3 ${
                    isSelected
                      ? "bg-sky-100 font-semibold"
                      : "hover:bg-sky-100/60"
                  }`}
                >
                  {/* 체크박스 */}
                  <div
                    className={`w-5 h-5 rounded border-2 flex items-center justify-center transition ${
                      isSelected
                        ? "border-sky-500 bg-sky-500"
                        : "border-gray-300 bg-white"
                    }`}
                  >
                    {isSelected && (
                      <svg
                        width="12"
                        height="10"
                        viewBox="0 0 12 10"
                        fill="none"
                      >
                        <path
                          d="M1 5L4.5 8.5L11 1"
                          stroke="white"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    )}
                  </div>
                  <span>{option.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 선택된 단원 태그 */}
      {selectedUnits.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-2">
          {selectedUnits.map((unitValue) => {
            const option = options.find((o) => o.value === unitValue);
            if (!option) return null;
            return (
              <span
                key={unitValue}
                className="inline-flex items-center gap-1.5 rounded-full bg-sky-100 px-3 py-1.5 text-xs max-[380px]:text-[10px] font-semibold text-sky-600"
              >
                {option.label}
                <button
                  type="button"
                  onClick={() => removeUnit(unitValue)}
                  className="hover:bg-sky-500 hover:text-white rounded-full w-4 h-4 flex items-center justify-center transition"
                >
                  ×
                </button>
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
}
