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
        <span className="mb-1 block text-2x font-semibold text-[#3C357A]">{label}</span>
        <button
          ref={buttonRef}
          type="button"
          onClick={() => {
            setOpen((prev) => !prev);
            if (!open) setFocusedIndex(options.findIndex((o) => o.value === value));
          }}
          className="w-full h-15 rounded-2xl bg-white/80 border border-[#CFCBFF] px-4 text-sm text-[#1F1B3A] focus:outline-none focus:ring-2 focus:ring-[#8A7CF0] focus:border-[#8A7CF0] max-[380px]:h-10 max-[380px]:text-xs text-left flex items-center justify-between"
        >
          <span className={selectedOption ? "text-[#1F1B3A]" : "text-gray-400"}>
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
        <div className="absolute z-50 mt-2 w-full rounded-2xl border border-[#CFCBFF] bg-white shadow-lg overflow-hidden">
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
                  className={`w-full px-4 py-3 text-sm text-[#1F1B3A] text-left transition ${
                    isSelected
                      ? "bg-[#E9E6FF] font-semibold"
                      : isFocused
                      ? "bg-[#E9E6FF]"
                      : "hover:bg-[#E9E6FF]"
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
              className="w-full h-16 max-[380px]:h-12 rounded-xl bg-gradient-to-r from-[#6E63D5] to-[#8A7CF0] px-4 text-lg max-[380px]:text-base text-white font-semibold shadow-sm hover:shadow-md hover:from-[#5B52C8] hover:to-[#7A6FE0] active:scale-[0.98] transition-all disabled:cursor-not-allowed disabled:bg-gray-300 disabled:hover:bg-gray-300 disabled:opacity-50 disabled:from-gray-300 disabled:to-gray-300 disabled:active:scale-100"
            >
              20문항 시험지 만들기
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

