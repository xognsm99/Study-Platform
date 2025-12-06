"use client";

import { useEffect, useMemo, useState } from "react";
import { DEFAULT_QUIZ_SIZE } from "@/lib/utils/constants";
import ResultCard from "./ResultCard";

export type ProblemItem = {
  id: string;
  question: string;
  choices: string[];
  answerIndex: number;
  explanation: string;

  // "easy" | "medium" | "hard"
  difficulty?: string;

  // 자주 출제 여부
  frequent?: boolean;

  // (선택) 오답용 상세 해설이 나중에 오면 사용
  explanationWrong?: string;
};

type Props = {
  grade: string;
  subject: string;
  category: string;
};

function subjectLabel(subject: string) {
  // 필요하면 확장
  if (subject === "english") return "영어";
  if (subject === "math") return "수학";
  return subject;
}

function categoryLabel(category: string) {
  // 영어 카테고리 예시
  switch (category) {
    case "midterm":
      return "중간";
    case "final":
      return "기말";
    case "vocab":
      return "어휘";
    case "grammar":
      return "문법";
    case "reading":
      return "독해";
    case "writing":
      return "서술";
    default:
      return category;
  }
}

function difficultyBadge(d?: string) {
  const v = String(d ?? "").toLowerCase();
  if (!v) return "";
  if (v === "easy") return "난이도: 하";
  if (v === "medium") return "난이도: 중";
  if (v === "hard") return "난이도: 상";
  return `난이도: ${v}`;
}

export default function QuizClient({ grade, subject, category }: Props) {
  const [loading, setLoading] = useState(true);
  const [problems, setProblems] = useState<ProblemItem[]>([]);
  const [idx, setIdx] = useState(0);

  const [selected, setSelected] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);

  // ✅ 정답/오답을 확실히 관리하기 위한 배열
  const [results, setResults] = useState<boolean[]>([]);

  // -------------------------
  // ✅ 데이터 로드
  // -------------------------
  useEffect(() => {
    let alive = true;

    async function load() {
      setLoading(true);
      setProblems([]);
      setIdx(0);
      setSelected(null);
      setSubmitted(false);
      setResults([]);

      try {
        const res = await fetch("/api/generate-problem", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            grade,
            subject,
            category,
            count: DEFAULT_QUIZ_SIZE,
          }),
        });

        const data = await res.json();

        if (!alive) return;

        setProblems(Array.isArray(data.problems) ? data.problems : []);
      } catch {
        if (!alive) return;
        setProblems([]);
      } finally {
        if (!alive) return;
        setLoading(false);
      }
    }

    load();

    return () => {
      alive = false;
    };
  }, [grade, subject, category]);

  // -------------------------
  // ✅ 현재 문제
  // -------------------------
  const current = problems[idx];

  // -------------------------
  // ✅ 진행 텍스트
  // -------------------------
  const progressText = useMemo(() => {
    const total = problems.length || DEFAULT_QUIZ_SIZE;
    return `${Math.min(idx + 1, total)}/${total}`;
  }, [idx, problems.length]);

  // -------------------------
  // ✅ 난이도 텍스트
  // -------------------------
  const difficultyText = useMemo(() => {
    if (!current) return "";
    return difficultyBadge(current.difficulty);
  }, [current]);

  // -------------------------
  // ✅ 정답/오답 카운트
  // -------------------------
  const correctCount = useMemo(
    () => results.filter(Boolean).length,
    [results]
  );
  const wrongCount = useMemo(
    () => results.filter((v) => v === false).length,
    [results]
  );

  // -------------------------
  // ✅ 제출 처리
  // -------------------------
  async function submitAnswer(choiceIndex: number) {
    if (submitted) return;
    if (!current) return;

    setSelected(choiceIndex);
    setSubmitted(true);

    const isCorrect = choiceIndex === current.answerIndex;

    // ✅ idx 위치에 결과 저장
    setResults((prev) => {
      const next = [...prev];
      next[idx] = isCorrect;
      return next;
    });

    // 서버 채점/기록 (실패해도 UI 유지)
    try {
      await fetch("/api/submit-answer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          problemId: current.id,
          selectedIndex: choiceIndex,
          isCorrect,
          grade,
          subject,
          category,
        }),
      });
    } catch {}
  }

  // -------------------------
  // ✅ 다음 문제
  // -------------------------
  function next() {
    if (!submitted) return;

    setSelected(null);
    setSubmitted(false);
    setIdx((i) => i + 1);
  }

  // -------------------------
  // ✅ 로딩 화면
  // -------------------------
  if (loading) {
    return (
      <div className="rounded-2xl border bg-white p-6 text-slate-900">
        <div className="animate-pulse space-y-3">
          <div className="h-4 w-1/3 rounded bg-gray-200" />
          <div className="h-6 w-full rounded bg-gray-200" />
          <div className="h-10 w-full rounded bg-gray-200" />
          <div className="h-10 w-full rounded bg-gray-200" />
          <div className="h-10 w-full rounded bg-gray-200" />
        </div>
        <p className="mt-4 text-sm text-gray-500">문제를 생성 중입니다...</p>
      </div>
    );
  }

  // -------------------------
  // ✅ 문제 없음
  // -------------------------
  if (!problems.length) {
    return (
      <div className="rounded-2xl border bg-white p-6 text-slate-900">
        <p className="text-sm text-gray-600">
          문제를 불러오지 못했습니다. 다시 시도해 주세요.
        </p>
      </div>
    );
  }

  // -------------------------
  // ✅ 결과 화면
  // -------------------------
  if (idx >= problems.length) {
    return (
      <ResultCard
        total={problems.length}
        correct={correctCount}
        wrong={wrongCount}
        grade={grade}
        subject={subject}
        category={category}
      />
    );
  }

  // -------------------------
  // ✅ 안전 가드
  // -------------------------
  if (!current) {
    return (
      <div className="rounded-2xl border bg-white p-6 text-slate-900">
        <p className="text-sm text-gray-600">
          문제를 불러오는 중입니다. 잠시 후 다시 시도해 주세요.
        </p>
      </div>
    );
  }

  const subjText = subjectLabel(subject);
  const catText = categoryLabel(category);

  return (
    <div className="rounded-2xl border bg-white p-5 shadow-sm text-slate-900">
      {/* 상단 메타 */}
      <div className="mb-3 flex items-center justify-between text-xs">
        <span className="text-gray-500">
          {grade} · {subjText} · {catText}
        </span>

        <div className="flex items-center gap-2">
          {difficultyText && (
            <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-medium text-blue-700">
              {difficultyText}
              {current.frequent && " · 자주 출제"}
            </span>
          )}
          <span className="text-gray-500">{progressText}</span>
        </div>
      </div>

      {/* 문제 */}
      <h2 className="mb-4 text-base font-semibold leading-relaxed">
        {current.question}
      </h2>

      {/* 선택지 */}
      <div className="space-y-2">
        {current.choices.map((c, i) => {
          const isAnswer = i === current.answerIndex;
          const isSelected = i === selected;

          const base =
            "w-full rounded-xl border px-4 py-3 text-left text-sm transition";

          const state =
            !submitted
              ? "hover:bg-gray-50"
              : isAnswer
              ? "border-green-400 bg-green-50"
              : isSelected
              ? "border-red-400 bg-red-50"
              : "opacity-70";

          return (
            <button
              key={i}
              className={`${base} ${state}`}
              onClick={() => submitAnswer(i)}
              disabled={submitted}
            >
              <span className="mr-2 inline-block w-5 text-xs text-gray-500">
                {i + 1}.
              </span>
              {c}
            </button>
          );
        })}
      </div>

      {/* ✅ 해설: 제출 후에만 표시 */}
      {submitted && (
        <div className="mt-4 rounded-xl bg-gray-50 p-3">
          <div className="mb-1 text-xs font-semibold text-gray-600">해설</div>

          {/* 오답일 때 더 구체적 해설이 있으면 우선 사용 */}
          <p className="text-sm text-gray-700">
            {results[idx] === false && current.explanationWrong
              ? current.explanationWrong
              : current.explanation}
          </p>
        </div>
      )}

      <div className="mt-4 flex items-center justify-between">
        <div className="text-xs text-gray-500">
          정답 {correctCount} · 오답 {wrongCount}
        </div>

        <button
          onClick={next}
          disabled={!submitted}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm text-white disabled:opacity-40"
        >
          다음
        </button>
      </div>
    </div>
  );
}
