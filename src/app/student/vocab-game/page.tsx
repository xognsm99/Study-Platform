"use client";

import { useEffect, useMemo, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import BlankSentence from "@/components/vocab-game/BlankSentence";
import AlphaKeypad from "@/components/vocab-game/AlphaKeypad";
import { useAlphaKeypadGame } from "@/components/vocab-game/useAlphaKeypadGame";

// ✅ 여기 타입은 지금 vocab-game에서 쓰는 problem 형태에 맞추면 됨
type VocabKeypadProblem = {
  id: string;
  grade: string;
  subject: string;
  sentence: string;
  answers: string[]; // jsonb -> supabase-js에서 배열로 들어옴
  level?: string | null;
  tags?: string | null;
};

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createClient(url, anon);
}

// 간단 셔플
function shuffle<T>(arr: T[]) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function VocabGamePage() {
  const router = useRouter();
  const supabase = useMemo(() => getSupabase(), []);

  const [loading, setLoading] = useState(true);
  const [problems, setProblems] = useState<VocabKeypadProblem[]>([]);
  const [idx, setIdx] = useState(0);

  // ✅ 누적 점수(원하면 표시)
  const [totalScore, setTotalScore] = useState(0);

  // ✅ 현재 문제에서 얻은 점수(완료 시 set)
  const [currentScore, setCurrentScore] = useState<number | null>(null);

  // 10문제 로드
  useEffect(() => {
    (async () => {
      setLoading(true);

      // 최신 60개 정도 가져와서 클라에서 섞은 뒤 10개만 사용(랜덤 느낌 + 안정적)
      const { data, error } = await supabase
        .from("vocab_keypad_problems")
        .select("id, grade, subject, sentence, answers, level, tags")
        .eq("grade", "2")
        .limit(60);

      if (error) {
        console.error(error);
        setProblems([]);
        setLoading(false);
        return;
      }

      const picked = shuffle(data ?? []).slice(0, 10);
      setProblems(picked as any);
      setIdx(0);
      setTotalScore(0);
      setCurrentScore(null);
      setLoading(false);
    })();
  }, [supabase]);

  const current = problems[idx];
  const isFinished = !loading && problems.length > 0 && idx >= problems.length;

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100 text-sm opacity-80">
        불러오는 중...
      </main>
    );
  }

  if (!loading && problems.length === 0) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100 text-sm opacity-80">
        문제를 불러오지 못했습니다. (DB 확인)
      </main>
    );
  }

  if (isFinished) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center gap-3 p-6 bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
        <div className="text-xl font-bold">완료!</div>
        <div className="text-sm opacity-80">
          최종 점수: <b>{totalScore}</b> / {problems.length}
        </div>

        <button
          className="mt-2 rounded-xl px-4 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          onClick={() => {
            // 다시하기
            setIdx(0);
            setTotalScore(0);
            setCurrentScore(null);
          }}
        >
          다시하기
        </button>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      {/* 헤더 */}
      <header className="border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 px-4 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <button
            onClick={() => router.back()}
            className="text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
          >
            ← 뒤로가기
          </button>
          <div className="text-lg font-semibold text-slate-800 dark:text-slate-100">
            어휘/숙어 게임
          </div>
          <div className="text-sm text-slate-600 dark:text-slate-400">
            점수: <b className="text-blue-600 dark:text-blue-400">{totalScore}</b>
          </div>
        </div>
      </header>

      {/* 게임 영역 */}
      <div className="max-w-4xl mx-auto py-8">
        {/* 진행 표시 */}
        <div className="mb-3 text-sm opacity-80 px-4">
          문제 {idx + 1} / {problems.length}
        </div>

        {/* ✅ 핵심: 현재 문제를 key로 "강제 리마운트" → 훅/입력 상태가 문제마다 초기화됨 */}
        <VocabGameView
          key={current.id}
          problem={current}
          onSolved={(score) => {
            // 문제 1개 완료 시 호출되게 연결
            setCurrentScore(score);
          }}
        />

        {/* 다음 버튼: "현재 문제 완료(onSolved 호출)"된 뒤에만 노출 */}
        <div className="mt-4 flex justify-end px-4">
          <button
            disabled={currentScore === null}
            className={`
              rounded-xl px-6 py-2 border-2 font-semibold transition-all
              ${
                currentScore === null
                  ? "opacity-40 cursor-not-allowed border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900/50 text-slate-400 dark:text-slate-500"
                  : "border-blue-500 dark:border-blue-400 bg-blue-500 dark:bg-blue-600 text-white hover:bg-blue-600 dark:hover:bg-blue-700 active:bg-blue-700 dark:active:bg-blue-800"
              }
            `}
            onClick={() => {
              if (currentScore === null) return;
              setTotalScore((v) => v + currentScore);
              setCurrentScore(null);
              setIdx((v) => v + 1);
            }}
          >
            다음 문제 →
          </button>
        </div>
      </div>
    </main>
  );
}

/**
 * ✅ 이 컴포넌트는 "지금 vocab-game에서 이미 만든 UI/훅"을 그대로 넣는 자리야.
 * - 기존 컴포넌트(BlankSentence, AlphaKeypad, useAlphaKeypadGame) 사용 유지
 * - 단지 problem을 props로 받고
 * - 정답 완료 시 onSolved(score)만 호출해주면 됨
 */
function VocabGameView({
  problem,
  onSolved,
}: {
  problem: VocabKeypadProblem;
  onSolved: (score: number) => void;
}) {
  const gameState = useAlphaKeypadGame({
    sentence: problem.sentence,
    answers: problem.answers,
    onComplete: () => {
      // 완료 시 콜백은 이미 useAlphaKeypadGame 내부에서 처리됨
    },
  });

  // 완료 시 onSolved 호출 (1회만)
  const hasCalledOnSolved = useRef(false);
  useEffect(() => {
    if (gameState.isComplete && !hasCalledOnSolved.current) {
      hasCalledOnSolved.current = true;
      onSolved(gameState.score);
    }
  }, [gameState.isComplete, gameState.score, onSolved]);

  // 문제가 바뀔 때마다 ref 리셋
  useEffect(() => {
    hasCalledOnSolved.current = false;
  }, [problem.id]);

  // 게임 모드 미지원 문제 처리
  if (!gameState.isValid) {
    return (
      <div className="mx-4 mb-6 p-8 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-lg text-center">
        <div className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-4">
          ⚠️ 게임 모드 미지원 문제
        </div>
        <p className="text-slate-600 dark:text-slate-400 mb-6">
          이 문제는 게임 모드로 플레이할 수 없습니다.
          <br />
          빈칸 수와 정답 수가 일치하지 않습니다.
        </p>
      </div>
    );
  }

  const {
    activeBlankIndex,
    userAnswers,
    score,
    isComplete,
    availableLetters,
    revealed,
    handleKeyPress,
    handleBackspace,
    handleBlankClick,
    handleHint,
    revealAnswer,
  } = gameState;

  return (
    <>
      {/* 완료 메시지 */}
      {isComplete && (
        <div className="mx-4 mb-6 p-4 bg-green-50 dark:bg-green-950/40 border-2 border-green-400 dark:border-green-500/40 rounded-lg text-center">
          <div className="text-xl font-bold text-green-700 dark:text-green-400 mb-2">
            🎉 완료!
          </div>
          <div className="text-green-600 dark:text-green-400">
            점수: {score} / {problem.answers.length}
          </div>
        </div>
      )}

      {/* 빈칸 문장 */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm mb-6">
        <BlankSentence
          sentence={problem.sentence}
          userAnswers={userAnswers}
          activeBlankIndex={activeBlankIndex}
          answers={problem.answers}
          revealed={revealed}
          onBlankClick={handleBlankClick}
        />
      </div>

      {/* 키패드 */}
      <AlphaKeypad
        letters={availableLetters}
        onKeyPress={handleKeyPress}
        onBackspace={handleBackspace}
        onHint={handleHint}
        onReveal={revealAnswer}
        disabled={isComplete}
      />
    </>
  );
}
