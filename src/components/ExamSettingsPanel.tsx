"use client";

import { useMemo, useState } from "react";
import type { ExamMeta, Publisher } from "@/types/exam";

const PUBLISHERS: Publisher[] = [
  "동아출판",
  "천재교육",
  "비상교육",
  "YBM",
  "능률",
  "기타",
];

type Props = {
  defaultMeta?: ExamMeta;
  onConfirm: (meta: ExamMeta) => void;
  grade: string;
  subject: string;
  category: string; // midterm/final
};

export default function ExamSettingsPanel({
  defaultMeta,
  onConfirm,
  grade,
  subject,
  category,
}: Props) {
  const now = new Date();
  const [year, setYear] = useState<number>(defaultMeta?.year ?? now.getFullYear());
  const [month, setMonth] = useState<number>(defaultMeta?.month ?? now.getMonth() + 1);

  const [publisher, setPublisher] = useState<Publisher>(defaultMeta?.publisher ?? "동아출판");
  const [range, setRange] = useState<string>(defaultMeta?.range ?? "1~3과");

  const [tagInput, setTagInput] = useState("");
  const [unitFocus, setUnitFocus] = useState<string[]>(defaultMeta?.unitFocus ?? []);

  const [shortRatio, setShortRatio] = useState<number>(
    Math.round(((defaultMeta?.style?.shortAnswerRatio ?? 0.15) * 100))
  );

  const termLabel = useMemo(() => {
    return category === "final" ? "기말고사" : "중간고사";
  }, [category]);

  function addTag() {
    const t = tagInput.trim();
    if (!t) return;
    if (unitFocus.includes(t)) {
      setTagInput("");
      return;
    }
    setUnitFocus((prev) => [...prev, t].slice(0, 8));
    setTagInput("");
  }

  function removeTag(t: string) {
    setUnitFocus((prev) => prev.filter((x) => x !== t));
  }

  function handleConfirm() {
    if (!onConfirm || typeof onConfirm !== "function") {
      if (process.env.NODE_ENV === "development") {
        console.error("ExamSettingsPanel: onConfirm is not a function", onConfirm);
      }
      return;
    }

    const safeShort = Math.min(Math.max(shortRatio, 0), 40) / 100;
    const safeMcq = Math.max(0.6, 1 - safeShort);

    const meta: ExamMeta = {
      year,
      month,
      termLabel,
      publisher,
      range,
      unitFocus,
      style: {
        mcqRatio: safeMcq,
        shortAnswerRatio: safeShort,
        avoidLongEssay: true,
      },
    };

    if (process.env.NODE_ENV === "development") {
      console.log("exam confirm clicked", meta);
    }

    onConfirm(meta);
  }

  return (
    <div className="rounded-2xl border bg-white p-6 shadow-sm text-slate-900">
      <div className="mb-2 text-xs text-gray-500">
        {grade} · {subject} · {termLabel}
      </div>
      <h3 className="mb-4 text-lg font-bold">시험 설정</h3>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="block">
          <span className="text-xs text-gray-600">시험 연도</span>
          <input
            type="number"
            className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
          />
        </label>

        <label className="block">
          <span className="text-xs text-gray-600">시험 월</span>
          <input
            type="number"
            min={1}
            max={12}
            className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
            value={month}
            onChange={(e) => setMonth(Number(e.target.value))}
          />
        </label>

        <label className="block">
          <span className="text-xs text-gray-600">교과서 출판사</span>
          <select
            className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
            value={publisher}
            onChange={(e) => setPublisher(e.target.value as Publisher)}
          >
            {PUBLISHERS.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="text-xs text-gray-600">시험 범위</span>
          <input
            type="text"
            className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
            placeholder="예: 1~3과 / Lesson 1-3 / 2단원 전체"
            value={range}
            onChange={(e) => setRange(e.target.value)}
          />
        </label>
      </div>

      <div className="mt-5">
        <div className="text-xs text-gray-600 mb-1">핵심 포인트(태그)</div>
        <div className="flex gap-2">
          <input
            type="text"
            className="w-full rounded-md border px-3 py-2 text-sm"
            placeholder="예: 관계대명사, 가정법, 핵심 어휘"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addTag();
              }
            }}
          />
          <button
            type="button"
            onClick={addTag}
            className="rounded-md bg-slate-900 px-3 py-2 text-sm text-white hover:bg-slate-800"
          >
            추가
          </button>
        </div>

        <div className="mt-2 flex flex-wrap gap-2">
          {unitFocus.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => removeTag(t)}
              className="rounded-full border px-3 py-1 text-xs hover:bg-slate-50"
              title="클릭하면 제거"
            >
              {t} ×
            </button>
          ))}
          {unitFocus.length === 0 && (
            <span className="text-xs text-gray-400">
              최소 2~3개 넣으면 학교 시험 느낌이 확 살아납니다.
            </span>
          )}
        </div>
      </div>

      <div className="mt-5">
        <div className="text-xs text-gray-600 mb-1">
          단답/서답형 비중(지필 현실 반영)
        </div>
        <div className="flex items-center gap-3">
          <input
            type="range"
            min={0}
            max={40}
            value={shortRatio}
            onChange={(e) => setShortRatio(Number(e.target.value))}
            className="w-full"
          />
          <span className="text-xs w-14 text-right">{shortRatio}%</span>
        </div>
        <p className="mt-1 text-[11px] text-gray-500">
          장문 에세이형 서술은 제외하고, 빈칸/형태쓰기/문장완성 등 짧은 답 중심으로 유도합니다.
        </p>
      </div>

      <div className="mt-6 flex flex-col sm:flex-row gap-2">
        <button
          type="button"
          onClick={handleConfirm}
          className="w-full sm:w-auto rounded-md bg-slate-900 px-4 py-2 text-sm text-white hover:bg-slate-800"
        >
          이 설정으로 시험 생성
        </button>
      </div>
    </div>
  );
}

