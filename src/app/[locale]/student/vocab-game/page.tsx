"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import HandwritingPad from "@/components/vocab-game/HandwritingPad";
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
  const params = useParams<{ locale: string }>();
  const locale = params?.locale || "ko";

  const LIMIT = 10;
  const MAX_SCORE = 20;

  const initialItems = useMemo(() => {
    return (VOCAB_GAME_10 ?? []).slice(0, LIMIT);
  }, []);

  const [mounted, setMounted] = useState(false);
  const [items, setItems] = useState(initialItems);
  const [usageChecked, setUsageChecked] = useState(false);

  useEffect(() => {
    setMounted(true);
    setItems(shuffle(VOCAB_GAME_10 ?? []).slice(0, LIMIT));
  }, []);

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
      } finally {
        setUsageChecked(true);
      }
    }

    checkUsage();
  }, [mounted, usageChecked, router]);

  const [idx, setIdx] = useState(0);
  const [score, setScore] = useState<number>(0);
  const [hintUsed, setHintUsed] = useState<number>(0);
  
  const [userInput, setUserInput] = useState("");
  const [isChecked, setIsChecked] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [usedHintThisProblem, setUsedHintThisProblem] = useState(false);

  const cur = items[idx];
  const safeSentence = cur?.sentence ?? "문제가 없습니다.";
  const safeAnswers = cur?.answers ?? [];
  const correctAnswer = safeAnswers[0] ?? "";
  const isLast = idx >= items.length - 1;

  const handleCheck = () => {
    if (!userInput.trim()) return;

    const normalized = userInput.trim().toLowerCase();
    const correct = safeAnswers.some((ans) => ans.toLowerCase() === normalized);

    setIsChecked(true);
    setIsCorrect(correct);

    if (correct) {
      let earnedPoints = 2;
      if (usedHintThisProblem) {
        earnedPoints = 1;
      }
      setScore((prev) => Math.min(MAX_SCORE, prev + earnedPoints));
    }
  };

  const handleNext = () => {
    if (isLast) {
      const params = new URLSearchParams(window.location.search);
      params.set("score", String(score));
      params.set("total", String(MAX_SCORE));
      params.set("hint", String(hintUsed));
      params.set("reveal", "0");
      router.push(`/${locale}/student/vocab-game/result?${params.toString()}`);
    } else {
      setIdx((v) => Math.min(v + 1, items.length - 1));
      setUserInput("");
      setIsChecked(false);
      setIsCorrect(false);
      setShowHint(false);
      setUsedHintThisProblem(false);
    }
  };

  const handleHint = () => {
    setShowHint(true);
    if (!usedHintThisProblem) {
      setUsedHintThisProblem(true);
      setHintUsed((prev) => prev + 1);
    }
  };

  if (!mounted) {
    return <div className="min-h-screen bg-[#F5F3FF]" />;
  }

  if (!cur) {
    return (
      <div className="min-h-screen bg-[#F5F3FF] p-6">
        <div className="font-semibold mb-2">문제가 없습니다.</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F5F3FF] via-[#FAF8FF] to-[#F0EDFF]">
      <div className="max-w-[520px] mx-auto p-2">
        {/* 헤더 */}
        <div className="bg-gradient-to-r from-[#6E63D5] to-[#8B7FE8] text-white rounded-2xl px-4 py-4 flex items-center justify-between mb-6 shadow-lg w-full">
          <button
            onClick={() => router.back()}
            className="text-sm font-semibold opacity-95 hover:opacity-100 transition-opacity"
          >
            ← 뒤로
          </button>

          <div className="text-[20px] font-bold tracking-tight flex items-center gap-2">
            <span className="text-2xl">✍️</span>
            서술형 대비
          </div>

          <div className="text-sm font-semibold bg-white/20 px-3 py-1.5 rounded-lg backdrop-blur-sm">
            <span className="text-[#FFE156]">{score}</span> / {MAX_SCORE}
          </div>
        </div>

        {/* 문제 번호 */}
        <div className="text-sm font-semibold text-[#6E63D5] mb-3 flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-[#6E63D5] text-white flex items-center justify-center text-xs">
            {idx + 1}
          </div>
          <span>/ {items.length} 문제</span>
        </div>

        {/* 문장 카드 */}
        <div className="rounded-3xl bg-white/90 backdrop-blur-sm p-6 border-2 border-[#E6E3FA] mb-5 shadow-sm">
          <div className="text-[17px] font-medium text-gray-800 leading-relaxed mb-3">
            {safeSentence}
          </div>

          {cur.explain && (
            <div className="text-sm text-gray-600 mt-4 pt-4 border-t border-gray-100">
              💡 {(cur.explain ?? "").replace(/^\s*해설\s*[:：]\s*/i, "")}
            </div>
          )}
        </div>

        {/* 손글씨 패드 */}
        <div className="mb-4">
          <div className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
            <span className="text-lg">📝</span>
            손글씨로 연습하기
            <span className="text-xs text-gray-500">(쓰고 인식 버튼 클릭)</span>
          </div>
          <HandwritingPad
            disabled={isChecked}
            onRecognize={(text) => {
              // 인식된 텍스트를 입력창에 자동으로 채우기
              setUserInput(text);
            }}
          />
        </div>

        {/* 답 입력 */}
        <div className="rounded-3xl bg-white/90 backdrop-blur-sm p-5 border-2 border-[#E6E3FA] mb-4 shadow-sm">
          <label className="text-sm font-semibold text-gray-700 mb-2 block">
            정답 입력
          </label>
          <input
            type="text"
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === "Enter" && !isChecked) {
                handleCheck();
              }
            }}
            disabled={isChecked}
            placeholder="답을 입력하세요"
            className={[
              "w-full px-4 py-3.5 rounded-xl border-2 text-base font-medium transition-all",
              isChecked
                ? isCorrect
                  ? "border-green-400 bg-green-50 text-green-700"
                  : "border-red-400 bg-red-50 text-red-700"
                : "border-[#E6E3FA] bg-white focus:border-[#6E63D5] focus:outline-none focus:ring-2 focus:ring-[#6E63D5]/20",
            ].join(" ")}
          />

          {/* 결과 표시 */}
          {isChecked && (
            <div className={[
              "mt-3 p-3 rounded-xl text-sm font-semibold flex items-center gap-2",
              isCorrect
                ? "bg-green-100 text-green-700"
                : "bg-red-100 text-red-700"
            ].join(" ")}>
              {isCorrect ? (
                <>
                  <span className="text-xl">✅</span>
                  정답입니다! {usedHintThisProblem ? "(힌트 사용: +1점)" : "(+2점)"}
                </>
              ) : (
                <>
                  <span className="text-xl">❌</span>
                  오답입니다. 정답: <span className="font-bold">{correctAnswer}</span>
                </>
              )}
            </div>
          )}
        </div>

        {/* 힌트 */}
        {showHint && cur?.hint && (
          <div className="rounded-2xl bg-[#FFF4E6] border-2 border-[#FFD699] p-4 mb-4">
            <div className="text-sm font-semibold text-[#FF9500] mb-1">💡 힌트</div>
            <div className="text-sm text-gray-700">{cur?.hint}</div>
          </div>
        )}

        {/* 버튼 영역 */}
        <div className="flex gap-2 justify-end">
          {!isChecked && cur.hint && (
            <button
              onClick={handleHint}
              disabled={showHint}
              className={[
                "px-5 py-3 rounded-xl text-sm font-semibold transition-all",
                showHint
                  ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                  : "bg-[#FFD699] text-[#FF9500] hover:bg-[#FFC266] active:scale-95 shadow-sm"
              ].join(" ")}
            >
              💡 힌트 보기
            </button>
          )}

          {!isChecked ? (
            <button
              onClick={handleCheck}
              disabled={!userInput.trim()}
              className={[
                "px-6 py-3 rounded-xl text-sm font-semibold transition-all",
                !userInput.trim()
                  ? "bg-[#E7E5FF] text-[#6E63D5]/50 cursor-not-allowed"
                  : "bg-[#6E63D9] text-white shadow-md hover:shadow-lg hover:bg-[#5D52C4] active:scale-[0.98]",
              ].join(" ")}
            >
              ✓ 확인하기
            </button>
          ) : (
            <button
              onClick={handleNext}
              className="px-6 py-3 rounded-xl text-sm font-semibold bg-[#6E63D9] text-white shadow-md hover:shadow-lg hover:bg-[#5D52C4] active:scale-[0.98] transition-all"
            >
              {isLast ? "📊 결과 보기" : "→ 다음 문제"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
