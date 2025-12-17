"use client";

import { useCallback, useEffect, useMemo, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { DEFAULT_QUIZ_SIZE } from "@/lib/utils/constants";
import ResultCard from "./ResultCard";
import { buildExamTitle } from "@/lib/utils/exam";
import type { ProblemItem } from "./QuizClient";
import {
  categoryLabel,
  difficultyBadge,
  formatDialogue,
  generateHint,
  fetchProblemsFromAPI,
  loadExamMeta,
  subjectLabel,
  renderWithBlanks,
  pickText,
} from "./quiz-utils";

type Props = {
  grade: string;
  subject: string;
  category: string;
  initialProblems?: ProblemItem[]; // 학생 모드에서 미리 로드한 문제
  categories?: string[]; // 여러 카테고리 선택 시
};

const TIME_LIMIT = 20;
const MAX_HINTS = 3;
const MAX_TIME_STOPS = 2;

// ✅ 해설 플레이스홀더 집합 (UI에서만 사용, DB에는 저장하지 않음)
const PLACEHOLDERS = new Set([
  "해설이 제공되지 않았습니다.",
  "해설이 제공되지 않았습니다",
  "해설없음",
]);

// ✅ 의미 있는 해설 문자열만 골라주는 헬퍼 (placeholder/빈 문자열 무시)
function pickMeaningful(values: any[]): string {
  for (const v of values) {
    const s = String(v ?? "").trim();
    if (!s) continue;
    if (PLACEHOLDERS.has(s)) continue;
    return s;
  }
  return "";
}

export default function SingleQuizClient({ grade, subject, category, initialProblems, categories }: Props) {
  const router = useRouter();
  
  // ✅ 모든 Hook 선언 (early return 전에 모두 선언)
  const [loading, setLoading] = useState(true);
  const [problems, setProblems] = useState<ProblemItem[]>([]);
  const [idx, setIdx] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [results, setResults] = useState<boolean[]>([]);
  const [remainingHints, setRemainingHints] = useState<number>(MAX_HINTS);
  const [currentHintUsed, setCurrentHintUsed] = useState<boolean>(false);
  const [examMeta, setExamMeta] = useState<ReturnType<typeof loadExamMeta> | null>(null);

  const isExamMode = category === "midterm" || category === "final";
  const examCount = isExamMode ? 20 : DEFAULT_QUIZ_SIZE;

  // ✅ examMeta 로드
  useEffect(() => {
    setExamMeta(loadExamMeta(grade, subject, category));
  }, [grade, subject, category]);

  // ✅ fetchProblems
  const fetchProblems = useCallback(async () => {
    setLoading(true);
    setIdx(0);
    setResults([]);

    // ✅ 항상 categories 전달 (category 단일값도 처리)
    const { problems: loadedProblems, error } = await fetchProblemsFromAPI({
      grade,
      subject,
      categories: categories?.length ? categories : category ? [category] : undefined,
      category: categories?.length ? undefined : category, // 하위호환
    });

    if (error) {
      console.error("[SingleQuizClient] fetchProblems 에러:", error);
      setLoading(false);
      // 에러는 UI에서 처리 (문제 없음 상태로 표시)
      setProblems([]);
      return;
    }

    setProblems(loadedProblems);
    setLoading(false);
  }, [grade, subject, category, categories]);

  // ✅ fetchProblems ref
  const fetchProblemsRef = useRef(fetchProblems);
  useEffect(() => {
    fetchProblemsRef.current = fetchProblems;
  }, [fetchProblems]);

  // ✅ 데이터 로드 (첫 마운트)
  useEffect(() => {
    if (initialProblems && initialProblems.length > 0) {
      // 학생 모드: 미리 로드한 문제 사용
      setProblems(initialProblems);
      setLoading(false);
    } else {
      // 기존 모드: API에서 문제 로드
      fetchProblemsRef.current();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialProblems]);

  // ✅ 퀴즈 시작 시 힌트 상태 초기화 (시간 측정 비활성화)
  useEffect(() => {
    if (!loading && problems.length > 0) {
      setRemainingHints(MAX_HINTS);
      setCurrentHintUsed(false);

      try {
        localStorage.setItem("lastQuizQuestions", JSON.stringify(problems));
        localStorage.setItem("lastQuizMeta", JSON.stringify({
          grade,
          subject,
          category,
          isTripleMode: false,
        }));
      } catch (e) {
        console.error("Failed to save quiz to localStorage", e);
      }
    }
  }, [loading, problems, grade, subject, category]);

  // ✅ 문제 변경 시 힌트 상태만 리셋 (타이머 비활성화)
  useEffect(() => {
    setCurrentHintUsed(false);
  }, [idx]);

  // ✅ useMemo/useCallback
  const progressText = useMemo(() => {
    const total = problems.length || DEFAULT_QUIZ_SIZE;
    return `${Math.min(idx + 1, total)}/${total}`;
  }, [idx, problems.length]);

  const correctCount = useMemo(() => results.filter(Boolean).length, [results]);
  const wrongCount = useMemo(() => results.filter((v) => v === false).length, [results]);

  const difficultyText = useMemo(() => {
    const currentProblem = problems[idx];
    if (!currentProblem) return "";
    return difficultyBadge(currentProblem.difficulty);
  }, [problems, idx]);

  const submitAnswer = useCallback(async (choiceIndex: number) => {
    if (submitted) return;
    const currentProblem = problems[idx];
    if (!currentProblem) return;

    // ✅ 연습용 문제는 채점 불가
    if (currentProblem.isPracticeMode) {
      setSelected(choiceIndex);
      setSubmitted(true);
      setResults((prev) => [...prev, false]); // 연습용은 항상 오답으로 처리 (채점 불가)
      return;
    }

    setSelected(choiceIndex);
    setSubmitted(true);

    const isCorrect = choiceIndex === currentProblem.answerIndex;

    setResults((prev) => {
      const next = [...prev];
      next[idx] = isCorrect;
      return next;
    });

    try {
      await fetch("/api/submit-answer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          problemId: currentProblem.id,
          selectedIndex: choiceIndex,
          isCorrect,
          grade,
          subject,
          category,
        }),
      });
    } catch {}

    // ✅ 해설 디버그 로그 (제출 직후)
    try {
      const c: any = currentProblem?.content ?? {};
      const raw: any = c?.raw ?? {};
      const resolved = pickMeaningful([
        c?.explanation,
        raw["해설"], raw.해설,
        raw["해설(없으면 비움)"],
        raw["해설(없으면비움)"],
        raw["비고"], raw.비고,
        raw["메모"], raw.메모,
        currentProblem?.explanation,
      ]);
      const final = resolved || "해설이 제공되지 않았습니다.";
      console.log("EXPL_DEBUG", {
        id: currentProblem?.id,
        qtype: c?.qtype,
        cExpl: c?.explanation,
        rawHaeseol: raw["해설"] ?? raw.해설,
        resolvedExplanation: resolved,
        finalExplanation: final,
      });
    } catch {}
  }, [submitted, problems, idx, grade, subject, category]);

  const next = useCallback(() => {
    if (!submitted) return;
    setSelected(null);
    setSubmitted(false);
    setCurrentHintUsed(false);
    setIdx((i) => i + 1);
  }, [submitted]);

  // ✅ 결과 미리보기 핸들러
  const handleResultPreview = useCallback(() => {
    // 현재 상태에서 결과 데이터 생성
    const previewData = {
      correctCount: correctCount,
      wrongCount: wrongCount,
      totalCount: problems.length,
      score: problems.length > 0 ? Math.round((correctCount / problems.length) * 100) : 0,
      totalTimeMs: 0,
      hintUsedCount: MAX_HINTS - remainingHints,
      meta: {
        grade,
        subject,
        category,
        schoolName: examMeta?.schoolName || null,
        timestamp: Date.now(),
        isTripleMode: false,
      },
    };

    // localStorage에 저장
    try {
      localStorage.setItem("lastResultPreview", JSON.stringify(previewData));
      
      // locale 추출 (pathname에서)
      const pathname = window.location.pathname;
      const locale = pathname.split("/")[1] || "ko";
      
      // 결과 미리보기 페이지로 이동
      router.push(`/${locale}/student/result/preview`);
    } catch (e) {
      console.error("Failed to save result preview", e);
    }
  }, [correctCount, wrongCount, problems.length, remainingHints, grade, subject, category, examMeta?.schoolName, router]);

  // ✅ 계산값 정의
  const current = problems[idx];
  const total = problems.length;
  const correct = correctCount;
  const wrong = wrongCount;
  // ✅ 최소 1문제 이상 있고, 마지막 인덱스를 지난 경우만 종료로 판단
  const isFinished = problems.length > 0 && idx >= problems.length;
  // ✅ 최소 조건: grade/subject/category 존재 + 문제 1개 이상이면 렌더링
  const validProblems =
    typeof grade === "string" &&
    grade.length > 0 &&
    typeof subject === "string" &&
    subject.length > 0 &&
    typeof category === "string" &&
    category.length > 0 &&
    problems.length > 0;
  const isInsufficient = problems.length > 0 && problems.length < DEFAULT_QUIZ_SIZE;

  // ✅ early return (모든 Hook 선언 후)
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

  if (!validProblems) {
    const normalizedCategory = category;
    const categoryLabelText = categoryLabel(normalizedCategory);
    
    if (process.env.NODE_ENV === "development") {
      console.warn("[SingleQuizClient] 문제 준비 안됨:", {
        grade,
        subject,
        category,
        categories,
        problemCount: problems.length,
      });
    }
    
    const examTitle = examMeta ? buildExamTitle(examMeta) : `${grade} ${subjectLabel(subject)} ${categoryLabelText}`;
    
    // ✅ categories 표시용 텍스트
    const categoriesDisplay = categories && categories.length > 0 
      ? `categories: [${categories.join(", ")}]`
      : `category: ${normalizedCategory}`;
    
    return (
      <div className="rounded-2xl border bg-white p-6 text-slate-900">
        <div className="mb-4">
          {examMeta && (
            <div className="mb-2 text-xs text-gray-500">
              {examMeta.schoolName && `${examMeta.schoolName} · `}
              {examMeta.grade} · {subjectLabel(examMeta.subject)} · {categoryLabelText}
            </div>
          )}
          <h2 className="text-lg font-semibold">{examTitle}</h2>
        </div>
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
          <p className="text-sm text-amber-800">문제가 아직 준비되지 않았습니다.</p>
          <p className="mt-2 text-xs text-amber-700">문제 생성 데이터를 불러오거나 다시 시도해 주세요.</p>
          {process.env.NODE_ENV === "development" && (
            <p className="mt-2 text-xs text-amber-600">
              [개발] {categoriesDisplay} | 문제: {problems.length}개 | 조건 확인: grade="{grade}", subject="{subject}"
            </p>
          )}
        </div>
        {isExamMode && (
          <div className="mt-4">
            <button
              type="button"
              disabled
              className="rounded-md bg-gray-300 px-4 py-2 text-sm text-gray-500 cursor-not-allowed"
            >
              시험지 인쇄/PDF (문제 없음)
            </button>
          </div>
        )}
      </div>
    );
  }

  if (isFinished) {
    const examTitle = examMeta ? buildExamTitle(examMeta) : `${grade} ${subjectLabel(subject)} ${categoryLabel(category)}`;
    
    // locale 추출 (pathname에서)
    const pathname = typeof window !== "undefined" ? window.location.pathname : "";
    const locale = pathname.split("/")[1] || "ko";
    
    return (
      <ResultCard
        total={total}
        correct={correct}
        wrong={wrong}
        grade={grade}
        subject={subject}
        category={category}
        durationSeconds={0}
        hintUsedCount={MAX_HINTS - remainingHints}
        isTripleMode={false}
        roundResults={[]}
        locale={locale}
      />
    );
  }

  if (!current) {
    return (
      <div className="rounded-2xl border bg-white p-6 text-slate-900">
        <p className="text-sm text-gray-600">문제를 불러오는 중입니다. 잠시 후 다시 시도해 주세요.</p>
      </div>
    );
  }

  // ✅ 퀴즈 UI 렌더링
  const subjText = subjectLabel(subject);
  const catText = categoryLabel(category);
  const examTitle = examMeta ? buildExamTitle(examMeta) : `${grade} ${subjectLabel(subject)} ${categoryLabel(category)}`;
  
  // ✅ 문제 텍스트 추출
  const { passage, question } = pickText(current);

  // ✅ 지문(영영풀이/해석) 최종 값: content.stimulus 우선
  const c: any = current?.content ?? {};
  const finalPassage = String(
    c.stimulus ??
    c.raw?.지문 ??
    c.passage ??
    c.text ??
    c.sentence ??
    c.definition ??
    c.context ??
    passage ??
    ""
  ).trim();

  // ✅ 해설 텍스트 우선순위 (DB/엑셀 원본 최우선, placeholder/빈 문자열 무시)
  const raw: any = c?.raw ?? {};
  const resolvedExplanation = pickMeaningful([
    c?.explanation,                 // ✅ content.explanation 최우선
    raw["해설"], raw.해설,           // ✅ raw.해설
    raw["해설(없으면 비움)"],
    raw["해설(없으면비움)"],
    raw["비고"], raw.비고,
    raw["메모"], raw.메모,
    current?.explanation,           // ✅ 루트 explanation은 맨 마지막 fallback
  ]);
  const finalExplanation = resolvedExplanation || "해설이 제공되지 않았습니다.";
  
  return (
    <div className="rounded-2xl border bg-white p-5 shadow-sm text-slate-900">
      {/* 메타 정보 */}
      {examMeta && (
        <div className="mb-3 text-xs text-gray-500">
          {examMeta.schoolName && `${examMeta.schoolName} · `}
          {examMeta.grade} · {subjectLabel(examMeta.subject)} · {categoryLabel(examMeta.category)}
        </div>
      )}

      {/* 결과 보기 버튼 */}
      <div className="mb-3">
        <button
          type="button"
          onClick={handleResultPreview}
          className="rounded-md bg-purple-600 px-3 py-1.5 text-xs text-white hover:bg-purple-700"
        >
          결과 보기
        </button>
      </div>

      {/* 상단 메타 */}
      <div className="mb-3 flex items-center justify-between text-xs">
        <span className="text-gray-500">{grade} · {subjText} · {catText}</span>
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

      {/* ✅ 연습용(채점불가) 표시 */}
      {current.isPracticeMode && (
        <div className="mb-3 rounded-lg border-2 border-orange-200 bg-orange-50 p-2 text-center">
          <span className="text-xs font-semibold text-orange-700">⚠️ 연습용 (채점 불가)</span>
        </div>
      )}

      {/* ✅ 선택한 유형 문제 수 부족 경고 */}
      {isInsufficient && (
        <div className="mb-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
          선택한 유형의 문제가 부족합니다. 현재 {problems.length}문항만 제공됩니다.
        </div>
      )}

      {/* ✅ 1) 문제 */}
      <h2 className="text-xl font-bold mb-4">
        {renderWithBlanks(question || "문제가 비어 있습니다.")}
      </h2>

      {/* ✅ 2) 지문(영영풀이/본문/해석) - stimulus 포함 */}
      {finalPassage && (
        <div className="mb-4 mt-3 rounded-xl border p-4 whitespace-pre-wrap">
          {renderWithBlanks(finalPassage)}
        </div>
      )}

      {/* 힌트 (타임스탑 비활성화) */}
      <div className="mb-4 flex items-center justify-end gap-2">
        <button
          type="button"
          onClick={() => {
            if (!currentHintUsed && remainingHints > 0) {
              setRemainingHints((prev) => Math.max(0, prev - 1));
              setCurrentHintUsed(true);
            }
          }}
          disabled={currentHintUsed || submitted || remainingHints === 0}
          className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
            currentHintUsed || submitted || remainingHints === 0
              ? "bg-gray-200 text-gray-400 cursor-not-allowed"
              : "bg-blue-50 text-blue-700 hover:bg-blue-100"
          }`}
        >
          {currentHintUsed ? "✓ 힌트 사용됨" : remainingHints === 0 ? `💡 힌트(0)` : `💡 힌트(${remainingHints})`}
        </button>
      </div>

      {/* 힌트 표시 */}
      <div className="mb-4 min-h-[56px]">
        {currentHintUsed && (
          <div className="rounded-lg border-2 border-blue-200 bg-blue-50 p-3">
            <div className="text-xs font-semibold text-blue-700 mb-1">💡 힌트</div>
            <div className="text-sm text-blue-900">{generateHint(current, category)}</div>
          </div>
        )}
      </div>

      {/* 선택지 */}
      {current.choices && current.choices.length > 0 ? (
        <div className="space-y-2">
          {current.choices.map((c, i) => {
            const isAnswer = i === current.answerIndex;
            const isSelected = i === selected;
            const base = "w-full rounded-xl border px-4 py-3 text-left text-sm transition";
            const state = !submitted
              ? "hover:bg-gray-50 cursor-pointer"
              : isAnswer
              ? "border-green-400 bg-green-50"
              : isSelected
              ? "border-red-400 bg-red-50"
              : "opacity-70";

            return (
              <button
                key={i}
                type="button"
                className={`${base} ${state}`}
                onClick={() => submitAnswer(i)}
                disabled={submitted}
              >
                <span className="mr-2 inline-block w-5 text-xs text-gray-500">{i + 1}.</span>
                {c}
              </button>
            );
          })}
        </div>
      ) : (
        <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-500">
          선택지가 제공되지 않았습니다.
        </div>
      )}

      {/* 해설 */}
      {submitted && finalExplanation && (
        <div className="mt-4 rounded-xl bg-gray-50 p-3">
          <div className="mb-1 text-xs font-semibold text-gray-600">해설</div>
          <p className="text-sm text-gray-700 whitespace-pre-wrap">{finalExplanation}</p>
        </div>
      )}

      <div className="mt-4 flex items-center justify-between">
        <div className="text-xs text-gray-500">정답 {correctCount} · 오답 {wrongCount}</div>
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