"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { Flash4Payload } from "@/lib/quiz/schema";
import { Button } from "@/components/ui/button";

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
  const [countdown, setCountdown] = useState<number | null>(showCountdown ? 5 : null);
  const [showWord, setShowWord] = useState(!showCountdown); // 카운트다운 없으면 바로 단어 표시
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [highlightedAnswerIndex, setHighlightedAnswerIndex] = useState<number | null>(null);

  // payload가 바뀔 때마다 선택지를 셔플하고 새 answerIndex 계산
  const { shuffledChoices, correctAnswerText, shuffledAnswerIndex } = useMemo(() => {
    // 원본 정답 텍스트 추출
    const correctText = payload.choices[payload.answerIndex];
    
    // 선택지 셔플
    const shuffled = shuffleArray(payload.choices);
    
    // 셔플 후 정답 텍스트의 새 인덱스 찾기
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
        opacity: 0.15 + rng() * 0.1, // 0.15 ~ 0.25
        floatDuration: 8 + rng() * 4, // 8 ~ 12초
        floatDelay: rng() * 2, // 0 ~ 2초
        fontSize, // text-sm 또는 text-base
      };
    });
  }, [payload.focusWord, payload.choices, payload.decoys]);

  // 문제가 바뀔 때 상태 리셋
  useEffect(() => {
    if (showCountdown) {
      setCountdown(5);
      setShowWord(false);
    } else {
      setCountdown(null);
      setShowWord(true); // 카운트다운 없으면 바로 단어 표시
    }
    setSelectedIndex(null);
    setHighlightedAnswerIndex(null);
  }, [payload.focusWord, payload.choices, payload.answerIndex, showCountdown]);

  // showFeedback이 false로 바뀔 때 (다음 문제로 넘어갈 때) 선택 상태 리셋
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
    // 중복 호출 방지: 피드백 표시 중이거나 이미 선택한 경우 무시
    if (showFeedback || selectedIndex !== null) return;
    
    setSelectedIndex(index);
    // 선택한 텍스트 추출
    const selectedText = shuffledChoices[index];
    // 텍스트 매칭 기반 정답 판정
    const isCorrect = selectedText === correctAnswerText;
    
    // 정답 여부(boolean), 인덱스, 선택한 텍스트를 함께 전달 (딱 1회만 호출)
    onAnswer(isCorrect, index, selectedText);

    // 정답/오답에 따른 자동 이동 처리
    if (isCorrect) {
      // 정답: 세션 페이지에서 0.65초 후 자동 이동 처리
    } else {
      // 오답: 정답 버튼 하이라이트 후 세션 페이지에서 0.85초 후 자동 이동
      setHighlightedAnswerIndex(shuffledAnswerIndex);
    }
  };

  return (
    <div className="relative w-full min-h-[100svh] h-[100svh] overflow-hidden">
      {/* ✅ 배경: 우리 톤 연보라 그라데이션 + 은은한 하이라이트 블러 */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-[#F6F4FF] via-[#E9E6FF] to-[#DCD6FF]">
        <div className="absolute -top-24 -left-24 h-72 w-72 rounded-full bg-white/60 blur-3xl" />
        <div className="absolute -bottom-28 -right-28 h-80 w-80 rounded-full bg-[#6E63D5]/20 blur-3xl" />

        {/* 배경 decoys 단어들 (떠다니는 애니메이션) */}
        <div className="absolute inset-0 z-0 overflow-hidden">
          {decoyPositions.map((item, idx) => (
            <motion.div
              key={idx}
              className={`absolute ${item.fontSize} font-bold text-white/90 font-sans pointer-events-none blur-[1px] drop-shadow-sm`}
              style={{
                left: `${item.x}%`,
                top: `${item.y}%`,
                opacity: item.opacity,
                transform: `translate(-50%, -50%) rotate(${item.rotation}deg)`,
                textShadow: "0 1px 2px rgba(0, 0, 0, 0.1)",
              }}
              initial={{ opacity: 0 }}
              animate={{
                opacity: item.opacity,
                y: [0, -20, 0],
                x: [0, 15, 0],
              }}
              transition={{
                opacity: { duration: 0.5, delay: idx * 0.1 },
                y: {
                  duration: item.floatDuration,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: item.floatDelay,
                },
                x: {
                  duration: item.floatDuration * 1.3,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: item.floatDelay * 1.2,
                },
              }}
            >
              {item.word}
            </motion.div>
          ))}
        </div>
      </div>

      {/* 카운트다운 오버레이: 숫자만, 배경 제거 */}
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
              className="relative text-7xl md:text-[12rem] font-extrabold text-[#6E63D5] drop-shadow-[0_10px_30px_rgba(0,0,0,0.15)]"
              animate={{
                scale: [1, 1.15, 1],
              }}
              transition={{
                duration: 0.6,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            >
              {countdown}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ✅ 메인 콘텐츠: 단어 + 보기 한 화면에 딱 맞추기 */}
      <div className="flex h-full flex-col px-4 py-5">
        <div className="flex-1 flex flex-col items-center justify-start gap-4 min-h-0 pt-6">
          {/* ✅ 단어(문제) 영역 */}
          <div className="w-full max-w-[520px]">
            {showWord && (
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 300, damping: 20, mass: 0.8 }}
                className="flex flex-col items-center justify-center relative z-20"
              >
                <motion.div
                  className="relative rounded-full border border-[#E7E5FF] bg-white px-8 py-4 shadow-[0_4px_20px_rgba(110,99,213,0.25)] backdrop-blur-sm"
                  animate={{
                    boxShadow: [
                      "0 4px 20px rgba(110, 99, 213, 0.25)",
                      "0 6px 30px rgba(110, 99, 213, 0.35)",
                      "0 4px 20px rgba(110, 99, 213, 0.25)",
                    ],
                  }}
                  transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                >
                  <div className="relative font-sans text-4xl md:text-5xl font-bold tracking-tight text-[#2A2457] text-center">
                    {payload.focusWord}
                  </div>
                </motion.div>
              </motion.div>
            )}
          </div>

          {/* ✅ 보기(선택지) 영역 - 마지막으로 한 칸만 더 아래로 이동 */}
          {showWord && (
            <div className="w-full max-w-[520px] mt-16 max-[380px]:mt-12">
              <motion.div
                initial={{ y: 40, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.15, type: "spring", stiffness: 220 }}
                className="relative z-10"
              >
                <div className="text-center text-sm font-medium text-[#2A2457] mb-5">
                  다음 중 올바른 뜻을 고르시오
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {shuffledChoices.map((choice, index) => {
                    const isSelected = selectedIndex === index;
                    const isAnswer = choice === correctAnswerText;
                    const showResult = showFeedback && isSelected;
                    const isHighlighted = highlightedAnswerIndex === index;

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
                          className={`h-[80px] w-full rounded-2xl text-[15px] font-semibold border transition-all relative overflow-hidden px-5 ${
                            showResult
                              ? isCorrect
                                ? "bg-gradient-to-br from-green-400 to-green-600 border-green-300 text-white shadow-[0_0_18px_rgba(34,197,94,0.45)]"
                                : "bg-gradient-to-br from-red-400 to-red-600 border-red-300 text-white shadow-[0_0_18px_rgba(239,68,68,0.45)]"
                              : isHighlighted
                                ? "bg-gradient-to-br from-yellow-300 to-yellow-500 border-yellow-200 text-[#2A2457] shadow-[0_0_18px_rgba(234,179,8,0.45)]"
                                : "bg-[#F6F5FF] border-[#B9B4E4]/60 text-[#2A2457] shadow-sm hover:bg-[#B9B4E4]/35 hover:border-[#B9B4E4]"
                          }`}
                          whileHover={!showFeedback ? { scale: 1.03 } : {}}
                          whileTap={!showFeedback ? { scale: 0.97 } : {}}
                        >
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

