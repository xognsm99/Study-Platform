"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type Option = { value: string; label: string };

function uniqOptions(opts: Option[]) {
  const map = new Map<string, Option>();
  for (const o of opts) map.set(o.value, o);
  return Array.from(map.values());
}

export default function PurpleSelect({
  value,
  onChange,
  options,
  placeholder = "선택",
  disabled,
  selected = false,
}: {
  value: string;
  onChange: (v: string) => void;
  options: Option[];
  placeholder?: string;
  disabled?: boolean;
  selected?: boolean;
}) {
  const safeOptions = useMemo(() => uniqOptions(options), [options]);

  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);

  const selectedLabel =
    safeOptions.find((o) => o.value === value)?.label ?? "";

  useEffect(() => {
    function onDown(e: MouseEvent) {
      if (!rootRef.current) return;
      if (!rootRef.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setOpen((v) => !v)}
        className={[
          "h-12 w-full min-w-0 rounded-full px-4 text-sm max-[380px]:h-10 max-[380px]:text-xs text-left shadow-sm transition",
          "border outline-none",
          selected
            ? "bg-violet-50 border-violet-300 ring-1 ring-violet-200 cursor-pointer"
            : "bg-white border-gray-200 hover:bg-violet-50 hover:border-violet-200 focus:ring-2 focus:ring-violet-200 cursor-pointer",
          disabled ? "opacity-60 cursor-not-allowed" : "",
        ].join(" ")}
      >
        <span className={selectedLabel ? "text-slate-900" : "text-slate-400"}>
          {selectedLabel || placeholder}
        </span>

        {/* ✅ 삼각형(드롭다운 화살표) 통일 */}
        <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-500">
          <svg width="18" height="18" viewBox="0 0 20 20" fill="currentColor">
            <path d="M5.25 7.5l4.75 5 4.75-5" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      </button>

      {open && (
        <div className="absolute z-50 mt-2 w-full overflow-hidden rounded-2xl border border-[#B9B4E4]/60 bg-[#F6F5FF] shadow-lg">
          <div className="max-h-60 overflow-auto p-1">
            {safeOptions.map((opt) => {
              const active = opt.value === value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    onChange(opt.value);
                    setOpen(false);
                  }}
                  className={[
                    "w-full rounded-xl px-3 py-2 text-left text-sm transition",
                    active
                      ? "bg-[#B9B4E4]/55 text-slate-900"
                      : "hover:bg-[#B9B4E4]/35 text-slate-800",
                  ].join(" ")}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

