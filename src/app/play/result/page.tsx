"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import confetti from "canvas-confetti";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabaseBrowser } from "@/lib/supabase-browser";
import type { GameSet } from "@/lib/quiz/schema";

type GameResult = {
  answers: (number | string | number[] | null)[];
  startTime: number;
  endTime: number;
  timeSpentSec: number;
};

type ResultTheme = {
  emoji: string;
  title: string;
  desc: string;
  motion: {
    initial: any;
    animate: any;
    transition: any;
  };
};

function getResultTheme(score: number): ResultTheme {
  if (score >= 100) {
    return {
      emoji: "🎉",
      title: "완벽합니다!",
      desc: "모든 문제를 맞추셨습니다!",
      motion: {
        initial: { scale: 0, opacity: 0, rotate: -8 },
        animate: { scale: 1, opacity: 1, rotate: 0 },
        transition: { type: "spring", stiffness: 220, damping: 14 },
      },
    };
  }
  if (score >= 90) {
    return {
      emoji: "🏆",
      title: "거의 완벽!",
      desc: "한 끗 차이. 다시 하면 100점!",
      motion: {
        initial: { y: -16, opacity: 0 },
        animate: { y: 0, opacity: 1 },
        transition: { type: "spring", stiffness: 180 },
      },
    };
  }
  if (score >= 80) {
    return {
      emoji: "😎",
      title: "아주 좋아요!",
      desc: "이 페이스면 금방 90+ 갑니다.",
      motion: {
        initial: { scale: 0.9, opacity: 0 },
        animate: { scale: 1, opacity: 1 },
        transition: { type: "spring", stiffness: 160 },
      },
    };
  }
  if (score >= 70) {
    return {
      emoji: "👍",
      title: "괜찮습니다!",
      desc: "실수만 줄이면 점수 확 올라가요.",
      motion: {
        initial: { x: -12, opacity: 0 },
        animate: { x: 0, opacity: 1 },
        transition: { type: "spring", stiffness: 170 },
      },
    };
  }
  if (score >= 60) {
    return {
      emoji: "🙂",
      title: "기본은 탄탄!",
      desc: "조금만 더 하면 됩니다.",
      motion: {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        transition: { duration: 0.35 },
      },
    };
  }
  if (score >= 50) {
    return {
      emoji: "😅",
      title: "반은 성공!",
      desc: "여기서부터 성장 구간입니다.",
      motion: {
        initial: { scale: 1.06, opacity: 0 },
        animate: { scale: 1, opacity: 1 },
        transition: { type: "spring", stiffness: 150 },
      },
    };
  }
  if (score >= 40) {
    return {
      emoji: "😵",
      title: "조금만 더!",
      desc: "틀린 것만 복습하면 바로 올라가요.",
      motion: {
        initial: { y: 12, opacity: 0 },
        animate: { y: 0, opacity: 1 },
        transition: { type: "spring", stiffness: 160 },
      },
    };
  }
  if (score >= 30) {
    return {
      emoji: "😭",
      title: "헷갈렸죠?",
      desc: "정리할 타이밍. 다시 한 판!",
      motion: {
        initial: { rotate: -6, opacity: 0 },
        animate: { rotate: 0, opacity: 1 },
        transition: { type: "spring", stiffness: 140 },
      },
    };
  }
  if (score >= 20) {
    return {
      emoji: "😭",
      title: "지금부터 시작!",
      desc: "10분만 더 하면 달라집니다.",
      motion: {
        initial: { scale: 0.88, opacity: 0 },
        animate: { scale: 1, opacity: 1 },
        transition: { type: "spring", stiffness: 150 },
      },
    };
  }
  if (score >= 10) {
    return {
      emoji: "😭",
      title: "한 번만 더!",
      desc: "이번엔 진짜 됩니다. 다시 가자!",
      motion: {
        initial: { y: -10, opacity: 0 },
        animate: { y: 0, opacity: 1 },
        transition: { type: "spring", stiffness: 170 },
      },
    };
  }
  return {
    emoji: "💀",
    title: "0점은 레전드…",
    desc: "오히려 좋아요. 이제 올라갈 일만 남았음.",
    motion: {
      initial: { x: 0, opacity: 0 },
      animate: { x: [0, -8, 8, -6, 6, 0], opacity: 1 },
      transition: { duration: 0.45 },
    },
  };
}

export default function PlayResultPage() {
  const router = useRouter();
  const [gameSet, setGameSet] = useState<GameSet | null>(null);
  const [result, setResult] = useState<GameResult | null>(null);
  const [score, setScore] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [isPerfect, setIsPerfect] = useState(false);
  const [hasPlayedSound, setHasPlayedSound] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const storedSet = sessionStorage.getItem("currentGameSet");
    const storedResult = sessionStorage.getItem("gameResult");

    if (!storedSet || !storedResult) {
      router.push("/play");
      return;
    }

    try {
      const parsedSet = JSON.parse(storedSet) as GameSet;
      const parsedResult = JSON.parse(storedResult) as GameResult;
      setGameSet(parsedSet);
      setResult(parsedResult);

      // 점수 계산
      let correct = 0;
      parsedSet.items.forEach((item, idx) => {
        const answer = parsedResult.answers[idx];
        let isCorrect = false;

        if (item.type === "flash4") {
          // 텍스트 매칭 기반 정답 판정 (셔플된 배열 기준이므로 인덱스 비교 불가)
          const correctAnswerText = item.payload.choices[item.payload.answerIndex];
          isCorrect = typeof answer === "string" && answer === correctAnswerText;
        } else if (item.type === "spell") {
          isCorrect = String(answer).toLowerCase() === item.payload.answer.toLowerCase();
        } else if (item.type === "binaryPassage") {
          const userAnswers = (answer as number[]) || [];
          isCorrect = item.payload.questions.every(
            (q, qIdx) => userAnswers[qIdx] === q.answerIndex
          );
        }

        if (isCorrect) correct++;
      });

      setCorrectCount(correct);
      setScore(Math.round((correct / parsedSet.items.length) * 100));
      setIsPerfect(correct === parsedSet.items.length);

      // 로그인한 사용자면 게임 시도 저장
      saveGameAttempt(parsedSet, correct, parsedSet.items.length, parsedResult.timeSpentSec);
    } catch (e) {
      console.error("Failed to load result", e);
      router.push("/play");
    }
  }, [router]);

  // 게임 시도 저장
  const saveGameAttempt = async (
    set: GameSet,
    correct: number,
    total: number,
    timeSpent: number
  ) => {
    try {
      const supabase = supabaseBrowser();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      const userId = user?.id;

      if (!userId) {
        // 비로그인 사용자는 저장하지 않음
        return;
      }

      // gameSetId가 있으면 사용, 없으면 null (mock 데이터)
      const gameSetId = set.id || null;

      const response = await fetch("/api/game/attempts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          gameSetId,
          userId,
          score: Math.round((correct / total) * 100),
          correctCount: correct,
          totalCount: total,
          timeSpentSec: timeSpent,
        }),
      });

      if (response.ok) {
        setSaved(true);
      }
    } catch (e) {
      console.error("Failed to save game attempt", e);
      // 저장 실패해도 결과는 표시
    }
  };

  // 전부 맞췄을 때 컨페티 + 진동
  useEffect(() => {
    if (!isPerfect || !hasPlayedSound) return;

    // 컨페티
    const duration = 3000;
    const end = Date.now() + duration;

    const interval = setInterval(() => {
      if (Date.now() > end) {
        clearInterval(interval);
        return;
      }

      confetti({
        particleCount: 2,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ["#6366f1", "#8b5cf6", "#ec4899"],
      });
      confetti({
        particleCount: 2,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ["#6366f1", "#8b5cf6", "#ec4899"],
      });
    }, 250);

    // 진동 (지원하는 경우)
    if (navigator.vibrate) {
      navigator.vibrate(40);
    }

    return () => clearInterval(interval);
  }, [isPerfect, hasPlayedSound]);

  // 사용자 첫 상호작용 후 사운드 활성화
  const handleUserInteraction = () => {
    if (!hasPlayedSound) {
      setHasPlayedSound(true);
    }
  };

  if (!gameSet || !result) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F6F5FF]">
        <div className="text-[#2A2457]">로딩 중...</div>
      </div>
    );
  }

  const theme = getResultTheme(score);

  return (
    <div
      className="min-h-screen bg-[#F6F5FF]"
      onClick={handleUserInteraction}
      onTouchStart={handleUserInteraction}
    >
      <div className="mx-auto max-w-2xl px-4 py-1">
        <motion.div
          initial={theme.motion.initial}
          animate={theme.motion.animate}
          transition={theme.motion.transition}
          className="mb-4 text-center"
        >
          <div className="text-4xl mb-2">{theme.emoji}</div>
          <h1 className="text-2xl font-bold text-[#6E63D5]">{theme.title}</h1>
          <p className="mt-1 text-sm text-[#2A2457]">{theme.desc}</p>
        </motion.div>

        <div className="rounded-[24px] bg-white/70 backdrop-blur shadow-[0_24px_60px_rgba(110,99,213,0.20)] p-6">
          <div className="text-center mb-4">
            <h2 className="text-xl font-bold text-[#2A2457]">결과</h2>
            <p className="mt-1 text-sm text-[#2A2457]/70">이제 문제 풀러 GO?</p>
          </div>
          <div className="space-y-4">
            {/* 점수 */}
            <div className="text-center">
              <div className="text-5xl font-bold leading-none min-h-[60px] text-[#6E63D5]">{score}</div>
              <div className="mt-1 text-sm text-[#2A2457]">점</div>
            </div>

            {/* 통계 */}
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-xl border border-[#B9B4E4]/60 bg-white p-3 text-center hover:bg-[#B9B4E4]/25 transition-colors">
                <div className="min-h-[28px] flex items-center justify-center text-center text-xl font-bold leading-none tabular-nums text-[#2A2457]">
                  {correctCount}
                </div>
                <div className="mt-1 text-xs text-[#2A2457]/70">정답</div>
              </div>
              <div className="rounded-xl border border-[#B9B4E4]/60 bg-white p-3 text-center hover:bg-[#B9B4E4]/25 transition-colors">
                <div className="min-h-[28px] flex items-center justify-center text-center text-xl font-bold leading-none tabular-nums text-[#2A2457]">
                  {gameSet.items.length}
                </div>
                <div className="mt-1 text-xs text-[#2A2457]/70">전체</div>
              </div>
              <div className="rounded-xl border border-[#B9B4E4]/60 bg-white p-3 text-center hover:bg-[#B9B4E4]/25 transition-colors">
                <div className="min-h-[28px] flex items-center justify-center text-center text-xl font-bold leading-none tabular-nums text-[#2A2457]">
                  {Math.floor(result.timeSpentSec / 60)}:{(result.timeSpentSec % 60).toString().padStart(2, "0")}
                </div>
                <div className="mt-1 text-xs text-[#2A2457]/70">
                  <span>소요</span>
                  <br />
                  <span>시간</span>
                </div>
              </div>
            </div>

            {/* 배지 */}
            {isPerfect && (
              <div className="flex justify-center">
                <Badge variant="success" className="px-4 py-2 text-sm">
                  완벽한 점수! 🌟
                </Badge>
              </div>
            )}

            {/* 버튼 */}
            <div className="space-y-3 pt-2">
              <Button
                onClick={() => {
                  if (typeof window !== "undefined") {
                    const params = new URLSearchParams(window.location.search);
                    const seed = params.get("seed");
                    router.replace(seed ? `/play?seed=${seed}` : `/play`);
                    router.refresh?.();
                  } else {
                    router.push("/play");
                  }
                }}
                className="w-full bg-[#6E63D5] text-white hover:bg-[#5F5AD8] shadow-md"
              >
                다시 하기
              </Button>
              <Button
                onClick={() => router.push("/")}
                variant="outline"
                className="w-full border-[#B9B4E4]/70 bg-[#F2F0FF] text-[#6E63D5] hover:bg-[#EAE6FF] hover:border-[#B9B4E4]"
              >
                홈으로
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

