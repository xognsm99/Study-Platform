"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { ScreenCard, ScreenTitle } from "@/components/ui/ScreenCard";

const GRADES = [
  { label: "중1 (준비중)", value: 1 },
  { label: "중2", value: 2 },
  { label: "중3 (준비중)", value: 3 },
];

const SUBJECTS = [
  { label: "영어", value: "english" },
  // 국어/사회는 나중에 확장
];

const UNIT_OPTIONS: Array<{ value: string; label: string }> = [
  { value: "u1", label: "1단원" },
  { value: "u2", label: "2단원" },
  { value: "u3", label: "3단원" },
  { value: "u4", label: "4단원" },
  { value: "u5", label: "5단원" },
  { value: "u6", label: "6단원" },
  { value: "u7", label: "7단원" },
  { value: "u8", label: "8단원" },
  { value: "u9", label: "9단원" },
  { value: "u10", label: "10단원" },
  { value: "u11", label: "11단원" },
  { value: "u12", label: "12단원" },
  { value: "mid1", label: "1학기 중간고사" },
  { value: "final1", label: "1학기 기말고사" },
  { value: "mid2", label: "2학기 중간고사" },
  { value: "final2", label: "2학기 기말고사" },
  { value: "overall", label: "종합평가" },
];

// SimpleSelect 컴포넌트 (커스텀 드롭다운)
type SimpleSelectOption = { value: string | number; label: string };

function SimpleSelect({
  label,
  value,
  onChange,
  options,
  placeholder = "선택",
}: {
  label: string;
  value: string | number;
  onChange: (v: string | number) => void;
  options: SimpleSelectOption[];
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);

  const selectedOption = options.find((o) => o.value === value);
  const displayText = selectedOption?.label || placeholder;

  // 바깥 클릭 시 닫기
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
        setFocusedIndex(-1);
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [open]);

  // 키보드 네비게이션
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (!open) {
        if (e.key === "Enter" || e.key === " " || e.key === "ArrowDown") {
          e.preventDefault();
          setOpen(true);
          setFocusedIndex(0);
        }
        return;
      }

      switch (e.key) {
        case "Escape":
          e.preventDefault();
          setOpen(false);
          setFocusedIndex(-1);
          buttonRef.current?.focus();
          break;
        case "ArrowDown":
          e.preventDefault();
          setFocusedIndex((prev) => {
            const next = prev < options.length - 1 ? prev + 1 : 0;
            // 스크롤 처리
            if (listRef.current) {
              const items = listRef.current.children;
              if (items[next]) {
                items[next].scrollIntoView({ block: "nearest", behavior: "smooth" });
              }
            }
            return next;
          });
          break;
        case "ArrowUp":
          e.preventDefault();
          setFocusedIndex((prev) => {
            const next = prev > 0 ? prev - 1 : options.length - 1;
            // 스크롤 처리
            if (listRef.current) {
              const items = listRef.current.children;
              if (items[next]) {
                items[next].scrollIntoView({ block: "nearest", behavior: "smooth" });
              }
            }
            return next;
          });
          break;
        case "Enter":
          e.preventDefault();
          if (focusedIndex >= 0 && focusedIndex < options.length) {
            onChange(options[focusedIndex].value);
            setOpen(false);
            setFocusedIndex(-1);
            buttonRef.current?.focus();
          }
          break;
      }
    }

    if (open) {
      document.addEventListener("keydown", handleKeyDown);
      return () => document.removeEventListener("keydown", handleKeyDown);
    }
  }, [open, focusedIndex, options, onChange]);

  const handleSelect = (optionValue: string | number) => {
    onChange(optionValue);
    setOpen(false);
    setFocusedIndex(-1);
  };

  return (
    <div ref={rootRef} className="relative">
      <label className="block">
        <span className="mb-1 block text-2x font-semibold text-[#1e40af]">{label}</span>
        <button
          ref={buttonRef}
          type="button"
          onClick={() => {
            setOpen((prev) => !prev);
            if (!open) setFocusedIndex(options.findIndex((o) => o.value === value));
          }}
          className="w-full h-12 rounded-2xl bg-white/80 border border-[#93c5fd] px-4 text-sm text-[#1e3a8a] focus:outline-none focus:ring-2 focus:ring-[#3b82f6] focus:border-[#3b82f6] max-[380px]:h-10 max-[380px]:text-xs text-left flex items-center justify-between transition-all"
        >
          <span className={selectedOption ? "text-[#1e3a8a]" : "text-gray-400"}>
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
      </label>

      {open && (
        <div className="absolute z-50 mt-2 w-full rounded-2xl border border-[#93c5fd] bg-white shadow-lg overflow-hidden">
          <div ref={listRef} className="max-h-60 overflow-auto">
            {options.map((option, index) => {
              const isSelected = option.value === value;
              const isFocused = index === focusedIndex;
              return (
                <button
                  key={String(option.value)}
                  type="button"
                  onClick={() => handleSelect(option.value)}
                  onMouseEnter={() => setFocusedIndex(index)}
                  className={`w-full px-4 py-3 text-sm text-[#1e3a8a] text-left transition ${
                    isSelected
                      ? "bg-[#dbeafe] font-semibold"
                      : isFocused
                      ? "bg-[#eff6ff]"
                      : "hover:bg-[#eff6ff]"
                  }`}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export default function TeacherHomePage() {
  const router = useRouter();
  const params = useParams();
  const locale = (params?.locale as string) || "ko";

  const [grade, setGrade] = useState<number>(2);
  const [subject, setSubject] = useState<string>("english");
  const [unit, setUnit] = useState<string>(UNIT_OPTIONS[0].value);

  const canProceed = useMemo(() => grade === 2 && !!subject, [grade, subject]);

  const handleNext = () => {
    if (!canProceed) return;
    const qs = new URLSearchParams({
      grade: String(grade),
      subject,
      unit,
    });
    router.push(`/${locale}/teacher/build?${qs.toString()}`);
  };

  // 옵션을 SimpleSelect 형식으로 변환
  const gradeOptions: SimpleSelectOption[] = GRADES.map((g) => ({
    value: g.value,
    label: g.label,
  }));

  const subjectOptions: SimpleSelectOption[] = SUBJECTS.map((s) => ({
    value: s.value,
    label: s.label,
  }));

  return (
    <div className="px-1 pt-3 pb-24">
      <div className="px-5 mb-6">
        <ScreenTitle>선생님 PICK</ScreenTitle>
      </div>

      <ScreenCard className="space-y-4">
          <SimpleSelect
            label="학년"
            value={grade}
            onChange={(v) => setGrade(Number(v))}
            options={gradeOptions}
            placeholder="학년 선택"
          />

          <SimpleSelect
            label="과목"
            value={subject}
            onChange={(v) => setSubject(String(v))}
            options={subjectOptions}
            placeholder="과목 선택"
          />

          <SimpleSelect
            label="단원"
            value={unit}
            onChange={(v) => setUnit(String(v))}
            options={UNIT_OPTIONS}
            placeholder="단원 선택"
          />

          <div className="pt-2">
            <button
              onClick={handleNext}
              disabled={!canProceed}
              className="group relative overflow-hidden w-full h-16 max-[380px]:h-12 rounded-[20px] text-lg max-[380px]:text-base font-semibold transition-all duration-500 ease-out select-none active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-50 disabled:active:scale-100"
              style={
                !canProceed
                  ? {
                      background: "linear-gradient(145deg, #e5e7eb 0%, #d1d5db 50%, #9ca3af 100%)",
                      boxShadow: "0 6px 20px -4px rgba(156,163,175,0.2)",
                      color: "#6b7280",
                    }
                  : {
                      background: "linear-gradient(145deg, #1e40af 0%, #1e3a8a 50%, #172554 100%)",
                      boxShadow: "0 10px 32px -4px rgba(30,64,175,0.5), 0 0 0 1px rgba(255,255,255,0.1) inset",
                      color: "white",
                    }
              }
            >
              {canProceed && (
                <>
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-400/0 to-blue-600/0 group-hover:from-blue-400/20 group-hover:to-blue-600/10 transition-all duration-500 pointer-events-none" />
                  <div
                    className="absolute top-0 left-0 right-0 h-[45%] opacity-40 group-hover:opacity-60 transition-opacity duration-500 pointer-events-none rounded-t-[20px]"
                    style={{ background: "linear-gradient(to bottom, rgba(255,255,255,0.25), transparent)" }}
                  />
                  <div
                    className="absolute -inset-[1px] rounded-[20px] opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                    style={{
                      background: "linear-gradient(145deg, rgba(96,165,250,0.6), rgba(59,130,246,0.4))",
                      filter: "blur(3px)",
                    }}
                  />
                  <div
                    className="absolute inset-0 opacity-[0.12] pointer-events-none"
                    style={{
                      background: `
                        radial-gradient(circle at 15% 30%, rgba(255,255,255,0.6) 0, transparent 2px),
                        radial-gradient(circle at 85% 25%, rgba(255,255,255,0.5) 0, transparent 1.5px),
                        radial-gradient(circle at 70% 70%, rgba(255,255,255,0.55) 0, transparent 2px)
                      `,
                    }}
                  />
                </>
              )}
              <span className="relative z-10 drop-shadow-[0_2px_8px_rgba(0,0,0,0.3)]">
                20문항 시험지 만들기
              </span>
            </button>
          </div>

      {grade !== 2 && (
            <p className="mt-2 text-xs text-[#6B6780] text-center">
              중2만 이용 가능합니다 (준비중)
            </p>
          )}
      </ScreenCard>
    </div>
  );
}

