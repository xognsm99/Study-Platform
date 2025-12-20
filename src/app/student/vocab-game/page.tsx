"use client";

import { useEffect, useMemo, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import BlankSentence from "@/components/vocab-game/BlankSentence";
import AlphaKeypad from "@/components/vocab-game/AlphaKeypad";
import { useAlphaKeypadGame } from "@/components/vocab-game/useAlphaKeypadGame";
import { VOCAB_GAME_SAMPLE, type VocabGameItem } from "@/lib/vocabGame/problems";

// ✅ 문제 데이터 타입 (VocabGameItem과 호환)
type VocabKeypadProblem = {
  id: string;
  sentence: string;
  answers: string[];
  translation?: string | null;
  koTranslation?: string | null;
  level?: string | null;
};

// 간단 셔플
function shuffle<T>(arr: T[]) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const POINTS_PER_QUESTION = 2;

export default function VocabGamePage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [problems, setProblems] = useState<VocabKeypadProblem[]>([]);
  const [idx, setIdx] = useState(0);

  // ✅ 누적 점수
  const [score, setScore] = useState(0);
  
  // ✅ 이번 문제에서 얻은 점수
  const [earnedThisQuestion, setEarnedThisQuestion] = useState<number | null>(null);
  
  // ✅ 이미 채점한 문제 index 기록 (중복 채점 방지)
  const scoredSetRef = useRef<Set<number>>(new Set());

  // 10문제 로드 (샘플 데이터에서 랜덤 선택)
  useEffect(() => {
    setLoading(true);

    // 샘플 데이터에서 랜덤으로 10개 선택
    const shuffled = shuffle([...VOCAB_GAME_SAMPLE]);
    const picked = shuffled.slice(0, 10);
    
    // VocabGameItem을 VocabKeypadProblem 형식으로 변환
    const normalized: VocabKeypadProblem[] = picked.map((item) => ({
      id: item.id,
      sentence: item.sentence,
      answers: item.answers,
      translation: item.translation || null,
      koTranslation: item.translation || null, // 호환성 유지
      level: item.level || null,
    }));

    setProblems(normalized);
    setIdx(0);
    setScore(0);
    setEarnedThisQuestion(null);
    scoredSetRef.current.clear();
    setLoading(false);
  }, []);

  const current = problems[idx];
  const isFinished = !loading && problems.length > 0 && idx >= problems.length;

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gradient-to-b from-[#6E63D5] via-[#B9B4E4] to-[#F6F5FF] text-[#2F2A57]">
        <div className="text-lg">불러오는 중...</div>
      </main>
    );
  }

  if (!loading && problems.length === 0) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gradient-to-b from-[#6E63D5] via-[#B9B4E4] to-[#F6F5FF] text-[#2F2A57]">
        <div className="text-lg">문제를 불러오지 못했습니다. (DB 확인)</div>
      </main>
    );
  }

  if (isFinished) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center gap-3 p-6 bg-gradient-to-b from-[#6E63D5] via-[#B9B4E4] to-[#F6F5FF] text-[#2F2A57]">
        <div className="text-3xl font-bold mb-2">🎉 완료!</div>
        <div className="text-lg opacity-90">
          최종 점수: <b className="text-[#6E63D5]">{score}</b> / {problems.length * POINTS_PER_QUESTION}
        </div>

        <button
          className="mt-4 rounded-xl px-6 py-3 bg-[#6E63D5] text-white font-semibold hover:bg-[#5B52C8] transition-colors shadow-md"
          onClick={() => {
            // 다시하기
            setIdx(0);
            setScore(0);
            setEarnedThisQuestion(null);
            scoredSetRef.current.clear();
          }}
        >
          다시하기
        </button>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-[#6E63D5] via-[#B9B4E4] to-[#F6F5FF] relative overflow-hidden">
      {/* 헤더 */}
      <header className="relative z-10 border-b border-[#E7E5FF] bg-[#6E63D5]/95 backdrop-blur-sm px-4 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <button
            onClick={() => router.back()}
            className="text-white/90 hover:text-white transition-colors font-medium"
          >
            ← 뒤로가기
          </button>
          <div className="text-lg font-semibold text-white">
            어휘/숙어 게임
          </div>
          <div className="text-sm text-white/90">
            점수: <b className="text-white">{score}</b> / {problems.length * POINTS_PER_QUESTION}
          </div>
        </div>
      </header>

      {/* 게임 영역 */}
      <div className="relative z-10 max-w-4xl mx-auto py-8">
        {/* 진행 표시 */}
        <div className="mb-3 text-sm text-[#2F2A57] px-4">
          문제 {idx + 1} / {problems.length}
        </div>

        {/* ✅ 핵심: 현재 문제를 key로 "강제 리마운트" → 훅/입력 상태가 문제마다 초기화됨 */}
        <VocabGameView
          key={current.id}
          problem={current}
          questionIndex={idx}
          onSolved={(earned) => {
            // 문제 1개 완료 시 호출되게 연결 (중복 채점 방지)
            if (!scoredSetRef.current.has(idx)) {
              scoredSetRef.current.add(idx);
              setEarnedThisQuestion(earned);
              setScore((prev) => prev + earned);
            }
          }}
        />

        {/* 완료 박스 (키패드/버튼 위에 표시) */}
        {earnedThisQuestion !== null && (
          <div className="mx-4 mb-4 p-4 bg-white/70 backdrop-blur-sm border-2 border-[#E7E5FF] rounded-2xl text-center ring-2 ring-[#E7E5FF] hover:ring-[#B9B4E4] transition-all">
            <div className="text-xl font-bold text-[#2F2A57] mb-2">
              🎉 완료!
            </div>
            <div className="text-[#2F2A57]">
              이번 문제 점수: {earnedThisQuestion} / {POINTS_PER_QUESTION}
            </div>
          </div>
        )}

        {/* 다음 버튼: "현재 문제 완료(onSolved 호출)"된 뒤에만 노출 */}
        <div className="mt-4 flex justify-end px-4">
          <button
            disabled={earnedThisQuestion === null}
            className={`
              rounded-xl px-6 py-3 font-semibold transition-all
              ${
                earnedThisQuestion === null
                  ? "opacity-40 cursor-not-allowed bg-white/60 text-[#2F2A57]/50"
                  : "bg-[#6E63D5] text-white hover:bg-[#5B52C8] active:bg-[#5B52C8] shadow-md"
              }
            `}
            onClick={() => {
              if (earnedThisQuestion === null) return;
              setEarnedThisQuestion(null);
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
 * - 정답 완료 시 onSolved(earned)만 호출해주면 됨
 */
function VocabGameView({
  problem,
  questionIndex,
  onSolved,
}: {
  problem: VocabKeypadProblem;
  questionIndex: number;
  onSolved: (earned: number) => void;
}) {
  const gameState = useAlphaKeypadGame({
    sentence: problem.sentence,
    answers: problem.answers,
    onComplete: () => {
      // 완료 시 콜백은 이미 useAlphaKeypadGame 내부에서 처리됨
    },
  });

  // 완료 시 onSolved 호출 (1회만) - 점수 계산 로직
  const hasCalledOnSolved = useRef(false);
  useEffect(() => {
    if (gameState.isComplete && !hasCalledOnSolved.current) {
      hasCalledOnSolved.current = true;
      
      // 정답 개수 계산 (대소문자 무시)
      let correctCount = 0;
      gameState.userAnswers.forEach((userAnswer, index) => {
        // userAnswer는 이미 소문자로 저장되어 있음 (handleKeyPress에서 처리)
        const userAnswerNormalized = userAnswer.toLowerCase().trim();
        const answerNormalized = problem.answers[index].toLowerCase().trim();
        if (userAnswerNormalized === answerNormalized) {
          correctCount++;
        }
      });
      
      // 점수 계산: 모든 정답이 맞고, 힌트/정답 보기를 사용하지 않았으면 2점, 아니면 0점
      const isAllCorrect = correctCount === problem.answers.length;
      const hasUsedHint = gameState.hintPenalty > 0;
      const hasUsedReveal = gameState.usedReveal;
      
      const earned = (isAllCorrect && !hasUsedHint && !hasUsedReveal) ? POINTS_PER_QUESTION : 0;
      
      onSolved(earned);
    }
  }, [gameState.isComplete, gameState.userAnswers, gameState.hintPenalty, gameState.usedReveal, problem.answers, onSolved]);

  // 문제가 바뀔 때마다 ref 리셋
  useEffect(() => {
    hasCalledOnSolved.current = false;
  }, [problem.id]);

  // 게임 모드 미지원 문제 처리
  if (!gameState.isValid) {
    return (
      <div className="mx-4 mb-6 p-8 bg-white/70 backdrop-blur-sm rounded-2xl border border-[#E7E5FF] shadow-lg text-center ring-2 ring-[#E7E5FF] hover:ring-[#B9B4E4] transition-all">
        <div className="text-2xl font-bold text-[#2F2A57] mb-4">
          ⚠️ 게임 모드 미지원 문제
        </div>
        <p className="text-[#2F2A57] mb-6">
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
    score: gameScore,
    isComplete,
    availableLetters,
    revealed,
    handleKeyPress,
    handleBackspace,
    handleBlankClick,
    handleHint,
    revealAnswer,
  } = gameState;

  // 한글 해석 텍스트
  const translationText = problem.translation || problem.koTranslation || "해석 준비중";

  return (
    <>
      {/* 빈칸 문장 */}
      <div className="mx-4 mb-4 bg-white/70 backdrop-blur-sm rounded-3xl border border-[#E7E5FF] shadow-lg ring-2 ring-[#E7E5FF] hover:ring-[#B9B4E4] transition-all">
        <BlankSentence
          sentence={problem.sentence}
          userAnswers={userAnswers}
          activeBlankIndex={activeBlankIndex}
          answers={problem.answers}
          revealed={revealed}
          onBlankClick={handleBlankClick}
        />
        
        {/* 한글 해석 */}
        <div className="px-4 pb-6 text-center">
          <div className="text-sm md:text-base text-[#2F2A57] font-medium">
            해석: {translationText}
          </div>
        </div>
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
