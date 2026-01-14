"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { Flash4Payload } from "@/lib/quiz/schema";

type Flash4QuizProps = {
  payload: Flash4Payload;
  onAnswer: (isCorrect: boolean, answerIndex: number, selectedText?: string) => void;
  showFeedback?: boolean;
  isCorrect?: boolean;
  showCountdown?: boolean; // 카운트다운 표시 여부 (기본값: true)
};

// Fisher-Yates 셔플 알고리즘
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// 랜덤 위치 생성 (문제가 바뀔 때만 생성되도록 useMemo 사용)
function generateRandomPositions(count: number, seed: string) {
  // seed를 기반으로 일관된 랜덤 생성
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = ((hash << 5) - hash + seed.charCodeAt(i)) | 0;
  }
  const rng = (() => {
    let state = Math.abs(hash);
    return () => {
      state = (state * 9301 + 49297) % 233280;
      return state / 233280;
    };
  })();

  return Array.from({ length: count }, () => ({
    x: rng() * 80 + 10, // 10% ~ 90%
    y: rng() * 70 + 15, // 15% ~ 85%
    rotation: 4 + rng() * 4, // 4deg ~ 8deg
  }));
}

export default function Flash4Quiz({
  payload,
  onAnswer,
  showFeedback = false,
  isCorrect = false,
  showCountdown = true,
}: Flash4QuizProps) {
  const [countdown, setCountdown] = useState<number | null>(showCountdown ? 3 : null);
  const [showWord, setShowWord] = useState(!showCountdown);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [highlightedAnswerIndex, setHighlightedAnswerIndex] = useState<number | null>(null);

  // payload가 바뀔 때마다 선택지를 셔플하고 새 answerIndex 계산
  const { shuffledChoices, correctAnswerText, shuffledAnswerIndex } = useMemo(() => {
    const correctText = payload.choices[payload.answerIndex];
    const shuffled = shuffleArray(payload.choices);
    const newAnswerIndex = shuffled.indexOf(correctText);

    return {
      shuffledChoices: shuffled,
      correctAnswerText: correctText,
      shuffledAnswerIndex: newAnswerIndex,
    };
  }, [payload.choices, payload.answerIndex]);

  // decoys 단어 랜덤 위치 생성 (문제가 바뀔 때만)
  const decoyPositions = useMemo(() => {
    const decoys = payload.decoys || [];
    const count = Math.min(Math.max(decoys.length, 8), 12);
    const selectedDecoys = decoys.slice(0, count);
    const seed = `${payload.focusWord}-${payload.choices.join("-")}`;
    const positions = generateRandomPositions(count, seed);
    const rng = (() => {
      let hash = 0;
      for (let i = 0; i < seed.length; i++) {
        hash = ((hash << 5) - hash + seed.charCodeAt(i)) | 0;
      }
      let state = Math.abs(hash);
      return () => {
        state = (state * 9301 + 49297) % 233280;
        return state / 233280;
      };
    })();

    return selectedDecoys.map((word, idx) => {
      const sizeRng = rng();
      const fontSize = sizeRng < 0.5 ? "text-sm" : "text-base";
      return {
        word,
        ...positions[idx],
        opacity: 0.12 + rng() * 0.1, // 살짝 더 은은하게
        floatDuration: 8 + rng() * 4,
        floatDelay: rng() * 2,
        fontSize,
      };
    });
  }, [payload.focusWord, payload.choices, payload.decoys]);

  // 문제가 바뀔 때 상태 리셋
  useEffect(() => {
    if (showCountdown) {
      setCountdown(3);
      setShowWord(false);
    } else {
      setCountdown(null);
      setShowWord(true);
    }
    setSelectedIndex(null);
    setHighlightedAnswerIndex(null);
  }, [payload.focusWord, payload.choices, payload.answerIndex, showCountdown]);

  // showFeedback이 false로 바뀔 때 선택 상태 리셋
  useEffect(() => {
    if (!showFeedback) {
      setSelectedIndex(null);
      setHighlightedAnswerIndex(null);
    }
  }, [showFeedback]);

  useEffect(() => {
    if (countdown === null) return;

    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setShowWord(true);
    }
  }, [countdown]);

  const handleSelect = (index: number) => {
    if (showFeedback || selectedIndex !== null) return;

    setSelectedIndex(index);
    const selectedText = shuffledChoices[index];
    const ok = selectedText === correctAnswerText;

    onAnswer(ok, index, selectedText);

    if (!ok) {
      setHighlightedAnswerIndex(shuffledAnswerIndex);
    }
  };

  return (
    <div className="relative w-full min-h-[100svh] h-[100svh] overflow-hidden">
      {/* ✅ 배경: 블루 계열 + 글래스 하이라이트 */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-sky-50 via-blue-50 to-indigo-50">
        <div className="absolute -top-28 -left-28 h-80 w-80 rounded-full bg-white/70 blur-3xl" />
        <div className="absolute top-24 -right-24 h-80 w-80 rounded-full bg-blue-600/15 blur-3xl" />
        <div className="absolute -bottom-32 left-1/3 h-96 w-96 rounded-full bg-indigo-900/10 blur-3xl" />

        {/* 배경 decoys 단어들 */}
        <div className="absolute inset-0 z-0 overflow-hidden">
          {decoyPositions.map((item, idx) => (
            <motion.div
              key={idx}
              className={`absolute ${item.fontSize} font-bold text-[#1e3a8a] font-sans pointer-events-none blur-[1px] drop-shadow-sm`}
              style={{
                left: `${item.x}%`,
                top: `${item.y}%`,
                opacity: item.opacity,
                transform: `translate(-50%, -50%) rotate(${item.rotation}deg)`,
                textShadow: "0 1px 2px rgba(15, 23, 42, 0.10)",
              }}
              initial={{ opacity: 0 }}
              animate={{
                opacity: item.opacity,
                y: [0, -20, 0],
                x: [0, 15, 0],
              }}
              transition={{
                opacity: { duration: 0.5, delay: idx * 0.08 },
                y: { duration: item.floatDuration, repeat: Infinity, ease: "easeInOut", delay: item.floatDelay },
                x: { duration: item.floatDuration * 1.3, repeat: Infinity, ease: "easeInOut", delay: item.floatDelay * 1.2 },
              }}
            >
              {item.word}
            </motion.div>
          ))}
        </div>
      </div>

      {/* 카운트다운 */}
      <AnimatePresence mode="wait">
        {countdown !== null && countdown > 0 && (
          <motion.div
            key={countdown}
            initial={{ scale: 0.3, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 1.8, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="fixed inset-0 z-40 flex items-center justify-center pointer-events-none"
          >
            <motion.div
              className="relative text-7xl md:text-[12rem] font-extrabold text-[#1e40af] drop-shadow-[0_10px_30px_rgba(30,64,175,0.18)]"
              animate={{ scale: [1, 1.15, 1] }}
              transition={{ duration: 0.6, repeat: Infinity, ease: "easeInOut" }}
            >
              {countdown}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 메인 */}
      <div className="flex h-full flex-col px-4 py-5">
        <div className="flex-1 flex flex-col items-center justify-start gap-4 min-h-0 pt-6">
          {/* 단어 */}
          <div className="w-full max-w-[520px]">
            {showWord && (
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 300, damping: 20, mass: 0.8 }}
                className="flex flex-col items-center justify-center relative z-20"
              >
                <motion.div
                  className="
                    relative rounded-full
                    border border-blue-200/60
                    bg-white/60
                    px-10 py-5
                    backdrop-blur-md
                    shadow-[0_18px_55px_rgba(30,64,175,0.12)]
                  "
                  animate={{
                    boxShadow: [
                      "0 18px 55px rgba(30,64,175,0.10)",
                      "0 22px 70px rgba(30,64,175,0.16)",
                      "0 18px 55px rgba(30,64,175,0.10)",
                    ],
                  }}
                  transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                >
                  {/* 살짝 상단 유광 하이라이트 */}
                  <div
                    className="absolute inset-0 rounded-full pointer-events-none"
                    style={{ background: "linear-gradient(to bottom, rgba(255,255,255,0.45), transparent 55%)" }}
                  />
                  <div className="relative font-sans text-4xl md:text-5xl font-extrabold tracking-tight text-[#172554] text-center">
                    {payload.focusWord}
                  </div>
                </motion.div>
              </motion.div>
            )}
          </div>

          {/* 보기 */}
          {showWord && (
            <div className="w-full max-w-[520px] mt-16 max-[380px]:mt-12">
              <motion.div
                initial={{ y: 40, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.15, type: "spring", stiffness: 220 }}
                className="relative z-10"
              >
                <div className="text-center text-sm font-semibold text-[#1e3a8a] mb-5">
                  다음 중 올바른 뜻을 고르시오
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {shuffledChoices.map((choice, index) => {
                    const isSelected = selectedIndex === index;
                    const showResult = showFeedback && isSelected;
                    const isHighlighted = highlightedAnswerIndex === index;

                    const base =
                      "h-[80px] w-full rounded-2xl text-[15px] font-semibold border relative overflow-hidden px-5 " +
                      "transition-all backdrop-blur-md " +
                      "bg-white/55 border-blue-200/70 text-[#172554] " +
                      "hover:bg-blue-50/70 hover:border-blue-300/70";

                    const selected =
                      "h-[80px] w-full rounded-2xl text-[15px] font-extrabold border relative overflow-hidden px-5 " +
                      "transition-all text-white border-white/25 " +
                      "shadow-[0_18px_55px_rgba(30,64,175,0.22)] " +
                      "bg-gradient-to-r from-[#1e40af] via-[#1e3a8a] to-[#172554]";

                    const correct =
                      "h-[80px] w-full rounded-2xl text-[15px] font-extrabold border relative overflow-hidden px-5 " +
                      "transition-all text-white border-white/25 " +
                      "shadow-[0_18px_55px_rgba(14,165,233,0.22)] " +
                      "bg-gradient-to-r from-[#0ea5e9] via-[#1e40af] to-[#1e3a8a]";

                    const wrong =
                      "h-[80px] w-full rounded-2xl text-[15px] font-extrabold border relative overflow-hidden px-5 " +
                      "transition-all text-white border-white/25 " +
                      "shadow-[0_18px_55px_rgba(239,68,68,0.18)] " +
                      "bg-gradient-to-r from-red-500 to-red-700";

                    const highlightAnswer =
                      "h-[80px] w-full rounded-2xl text-[15px] font-extrabold border relative overflow-hidden px-5 " +
                      "transition-all text-[#0b1220] border-blue-200/80 " +
                      "shadow-[0_0_18px_rgba(59,130,246,0.28)] " +
                      "bg-gradient-to-br from-blue-100 to-sky-100";

                    let cls = base;
                    if (!showFeedback && isSelected) cls = selected;
                    if (showResult) cls = isCorrect ? correct : wrong;
                    if (!showResult && isHighlighted) cls = highlightAnswer;

                    return (
                      <motion.div
                        key={index}
                        initial={{ scale: 0.95, opacity: 0 }}
                        animate={{ scale: isHighlighted ? [1, 1.05, 1] : 1, opacity: 1 }}
                        transition={{
                          delay: index * 0.06,
                          scale: { duration: 0.25, repeat: isHighlighted ? 2 : 0 },
                        }}
                        whileTap={{ scale: 0.97 }}
                      >
                        <motion.button
                          onClick={() => handleSelect(index)}
                          disabled={showFeedback}
                          className={cls}
                          whileHover={!showFeedback ? { scale: 1.03 } : {}}
                          whileTap={!showFeedback ? { scale: 0.97 } : {}}
                        >
                          {/* 유광 하이라이트 */}
                          <div
                            className="absolute inset-0 pointer-events-none opacity-50"
                            style={{ background: "linear-gradient(to bottom, rgba(255,255,255,0.35), transparent 60%)" }}
                          />
                          <div className="relative flex items-center justify-center gap-2 h-full">
                            <span className="font-bold break-keep leading-tight">{choice}</span>
                            {showResult && (
                              <motion.span
                                initial={{ scale: 0, rotate: -180 }}
                                animate={{ scale: [0, 1.3, 1], rotate: 0 }}
                                transition={{ duration: 0.45, ease: "backOut" }}
                                className="text-xl"
                              >
                                {isCorrect ? "✓" : "✗"}
                              </motion.span>
                            )}
                          </div>
                        </motion.button>
                      </motion.div>
                    );
                  })}
                </div>
              </motion.div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
