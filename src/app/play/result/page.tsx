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

  return (
    <div
      className="min-h-screen bg-[#F6F5FF]"
      onClick={handleUserInteraction}
      onTouchStart={handleUserInteraction}
    >
      <div className="mx-auto max-w-2xl px-4 py-16">
        {isPerfect && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 200 }}
            className="mb-8 text-center"
          >
            <div className="text-6xl mb-4">🎉</div>
            <h1 className="text-4xl font-bold text-[#6E63D5]">완벽합니다!</h1>
            <p className="mt-2 text-lg text-[#2A2457]">모든 문제를 맞추셨습니다!</p>
          </motion.div>
        )}

        <div className="rounded-[24px] bg-white/70 backdrop-blur shadow-[0_24px_60px_rgba(110,99,213,0.20)] p-6">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-[#2A2457]">결과</h2>
            <p className="mt-2 text-[#2A2457]/70">오늘의 미션을 완료했습니다</p>
          </div>
          <div className="space-y-6">
            {/* 점수 */}
            <div className="text-center">
              <div className="text-6xl font-bold text-[#6E63D5]">{score}</div>
              <div className="mt-2 text-sm text-[#2A2457]">점</div>
            </div>

            {/* 통계 */}
            <div className="grid grid-cols-3 gap-4">
              <div className="rounded-xl border border-[#B9B4E4]/60 bg-white p-4 text-center hover:bg-[#B9B4E4]/25 transition-colors">
                <div className="text-2xl font-bold text-[#2A2457]">{correctCount}</div>
                <div className="mt-1 text-xs text-[#2A2457]/70">정답</div>
              </div>
              <div className="rounded-xl border border-[#B9B4E4]/60 bg-white p-4 text-center hover:bg-[#B9B4E4]/25 transition-colors">
                <div className="text-2xl font-bold text-[#2A2457]">{gameSet.items.length}</div>
                <div className="mt-1 text-xs text-[#2A2457]/70">전체</div>
              </div>
              <div className="rounded-xl border border-[#B9B4E4]/60 bg-white p-4 text-center hover:bg-[#B9B4E4]/25 transition-colors">
                <div className="text-2xl font-bold text-[#2A2457]">
                  {Math.floor(result.timeSpentSec / 60)}:{(result.timeSpentSec % 60).toString().padStart(2, "0")}
                </div>
                <div className="mt-1 text-xs text-[#2A2457]/70">소요 시간</div>
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
            <div className="space-y-3 pt-4">
              <Button
                onClick={() => router.push("/play")}
                className="w-full bg-[#6E63D5] text-white hover:bg-[#5B52C8] shadow-md"
              >
                다시 하기
              </Button>
              <Button
                onClick={() => router.push("/")}
                variant="outline"
                className="w-full border-[#B9B4E4]/70 text-[#6E63D5] hover:bg-[#B9B4E4]/20 hover:border-[#B9B4E4]"
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

