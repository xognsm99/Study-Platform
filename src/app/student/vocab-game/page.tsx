"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import BlankSentence from "@/components/vocab-game/BlankSentence";
import AlphaKeypad from "@/components/vocab-game/AlphaKeypad";
import { useAlphaKeypadGame } from "@/components/vocab-game/useAlphaKeypadGame";

import { VOCAB_GAME_ITEMS as VOCAB_GAME_10 } from "./questions";

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

  const LIMIT = 10;
  const MAX_SCORE = 20; // 만점 (10문항 × 2점)

  // ✅ SSR/첫 렌더에서는 항상 같은 값(고정)으로 보여주기
  const initialItems = useMemo(() => {
    return (VOCAB_GAME_10 ?? []).slice(0, LIMIT);
  }, []);

  const [mounted, setMounted] = useState(false);
  const [items, setItems] = useState(initialItems);
  const [usageChecked, setUsageChecked] = useState(false);

  // ✅ mount 이후에만 랜덤 셔플 적용 (Hydration/Hook 에러 방지)
  useEffect(() => {
    setMounted(true);
    setItems(shuffle(VOCAB_GAME_10 ?? []).slice(0, LIMIT));
  }, []);

  // ✅ 퀴즈 시작 시 무료 사용 제한 체크 (quiz 1회 차감)
  useEffect(() => {
    if (!mounted || usageChecked) return;

    async function checkUsage() {
      try {
        const res = await fetch("/api/usage/quiz", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        });

        if (res.status === 403) {
          const json = await res.json();
          if (json?.needsSubscription) {
            const reason = json.reason || "quiz";
            console.log(`[vocab-game] 무료 제한 초과, /plans?reason=${reason}로 리다이렉트`);
            router.push(`/plans?reason=${reason}`);
            return;
          }
        }

        if (!res.ok) {
          console.warn("[vocab-game] 무료 사용 제한 체크 실패, 계속 진행:", res.status);
        } else {
          const json = await res.json();
          console.log("[vocab-game] 무료 제한 통과, remaining:", json.remaining);
        }
      } catch (err) {
        console.error("[vocab-game] 무료 사용 제한 체크 에러:", err);
        // 에러 발생 시 계속 진행 (사용자 차단하지 않음)
      } finally {
        setUsageChecked(true);
      }
    }

    checkUsage();
  }, [mounted, usageChecked, router]);

  const [idx, setIdx] = useState(0);
  const [score, setScore] = useState<number>(MAX_SCORE); // 20점 만점에서 시작, 패널티로 차감
  const [hintUsed, setHintUsed] = useState<number>(0); // 힌트 사용 횟수
  const [revealUsed, setRevealUsed] = useState<number>(0); // 정답보기 사용 횟수

  const counted = useRef(false);

  const cur = items[idx];

  // ✅ cur 없으면(데이터 없을 때) 안전 처리
  const safeSentence = cur?.sentence ?? "문제가 없습니다.";
  const safeAnswers = cur?.answers ?? [];

  const game = useAlphaKeypadGame({
    sentence: safeSentence,
    answers: safeAnswers,
    onComplete: ({ points, usedHint, usedReveal }) => {
      if (counted.current) return;
      counted.current = true;

      // 점수 차감 및 사용 횟수 카운트
      let penalty = 0;
      if (usedHint) {
        penalty += 1;
        setHintUsed((prev) => prev + 1);
      }
      if (usedReveal) {
        penalty += 2;
        setRevealUsed((prev) => prev + 1);
      }

      setScore((prev) => Math.max(0, prev - penalty));
    },
  });

  const isLast = idx >= items.length - 1;

  // mount 전에는 UI만 살짝 비워서 깜빡임 줄이기 (훅은 그대로 유지됨)
  if (!mounted) {
    return <div className="min-h-screen bg-[#F5F3FF]" />;
  }

  if (!cur) {
    return (
      <div className="min-h-screen bg-[#F5F3FF] p-6">
        <div className="font-semibold mb-2">문제가 없습니다.</div>
        <div className="text-sm text-gray-600">
          questions.ts에 VOCAB_GAME_ITEMS가 비었거나 LIMIT보다 적습니다.
        </div>
      </div>
    );
  }

  if (!game.isValid) {
    return (
      <div className="p-6">
        <div className="font-semibold mb-2">문제 설정 오류</div>
        <pre className="text-xs whitespace-pre-wrap bg-white/70 p-3 rounded-xl">
          {game.error}
        </pre>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F3FF]">
      <div className="max-w-[520px] mx-auto p-2">
        {/* 보라 헤더 바 */}
        <div className="bg-[#6E63D5] text-white rounded-none px-3 py-3 flex items-center justify-between mb-5 w-full">
          <button
            onClick={() => router.back()}
            className="text-sm font-medium opacity-95"
          >
            ← 뒤로가기
          </button>

          <div className="text-[18px] md:text-[24px] font-semibold tracking-tight">
            단어 게임 퀴즈
          </div>

          <div className="text-sm font-medium opacity-95">
            점수: {score} / {MAX_SCORE}
          </div>
        </div>

        <div className="text-sm text-gray-700 mb-2">
          문제 {idx + 1} / {items.length}
        </div>

        {/* 문장 카드 */}
        <div className="rounded-3xl bg-white/80 p-5 border border-[#E6E3FA] mb-4">
          <BlankSentence
            sentence={cur.sentence}
            userAnswers={game.userAnswers}
            activeBlankIndex={game.activeBlankIndex}
            answers={cur.answers}
            revealed={game.revealed}
            onBlankClick={(i) => game.setActiveBlankIndex(i)}
          />

          {cur.explain && (
            <div className="text-sm text-gray-700 mt-3">
              {(cur.explain ?? "").replace(/^\s*해설\s*[:：]\s*/i, "")}
            </div>
          )}
        </div>

        {/* 키패드 */}
        <AlphaKeypad
          letters={game.letters}
          onKeyPress={game.onKeyPress}
          onBackspace={game.onBackspace}
          onHint={game.onHint}
          onReveal={game.onReveal}
          disabled={game.isComplete}
        />

        {/* 다음 문제 / 결과 보기 */}
        <div className="mt-6 flex justify-end">
          <button
            disabled={!game.isComplete}
            onClick={() => {
              if (isLast) {
                // 마지막 문제 완료 시 결과 페이지로 이동
                const params = new URLSearchParams(window.location.search);
                params.set("score", String(score)); // 현재 점수 (0~20)
                params.set("total", String(MAX_SCORE)); // 만점 20
                params.set("hint", String(hintUsed)); // 힌트 사용 횟수
                params.set("reveal", String(revealUsed)); // 정답보기 사용 횟수
                router.push(`/student/vocab-game/result?${params.toString()}`);
              } else {
                // 다음 문제로 이동
                counted.current = false;
                setIdx((v) => Math.min(v + 1, items.length - 1));
              }
            }}
            className={[
              "px-6 py-3.5 rounded-xl text-sm font-semibold transition-all",
              !game.isComplete
                ? "bg-[#E7E5FF] text-[#6E63D5] opacity-100"
                : "bg-[#6E63D9] text-white shadow-sm active:scale-[0.98]",
            ].join(" ")}
          >
            {isLast ? "결과 보기 →" : "다음 문제 →"}
          </button>
        </div>
      </div>
    </div>
  );
}
