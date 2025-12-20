"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import type { SpellPayload } from "@/lib/quiz/schema";
import { Button } from "@/components/ui/button";

type SpellQuizProps = {
  payload: SpellPayload;
  onAnswer: (answer: string) => void;
  showFeedback?: boolean;
  isCorrect?: boolean;
};

export default function SpellQuiz({
  payload,
  onAnswer,
  showFeedback = false,
  isCorrect = false,
}: SpellQuizProps) {
  const [userInput, setUserInput] = useState<string>("");
  const [selectedLetters, setSelectedLetters] = useState<string[]>([]);
  const availableLetters = [...payload.poolLetters];

  const handleLetterClick = (letter: string) => {
    if (showFeedback) return;
    if (selectedLetters.length < payload.answer.length) {
      const newSelected = [...selectedLetters, letter];
      setSelectedLetters(newSelected);
      setUserInput(newSelected.join(""));
    }
  };

  const handleDelete = () => {
    if (showFeedback) return;
    const newSelected = selectedLetters.slice(0, -1);
    setSelectedLetters(newSelected);
    setUserInput(newSelected.join(""));
  };

  const handleSubmit = () => {
    if (showFeedback || userInput.length !== payload.answer.length) return;
    onAnswer(userInput);
  };

  // 사용된 문자 개수 계산
  const usedCounts = new Map<string, number>();
  selectedLetters.forEach((letter) => {
    usedCounts.set(letter, (usedCounts.get(letter) || 0) + 1);
  });

  const canSubmit = userInput.length === payload.answer.length;

  return (
    <div className="space-y-8">
      {/* 지시문 */}
      <div className="text-center">
        <div className="text-lg font-medium text-neutral-900">
          알파벳을 끼워넣어 단어를 완성하세요
        </div>
        <div className="mt-2 text-sm text-neutral-600">{payload.meaning}</div>
      </div>

      {/* 문장 + 언더바 입력 영역 */}
      <div className="rounded-2xl border border-neutral-200 bg-white p-8">
        <div className="mb-6 text-center text-lg leading-relaxed text-neutral-700">
          {payload.prompt.split("____").map((part, idx, arr) => (
            <span key={idx}>
              {part}
              {idx < arr.length - 1 && (
                <span className="mx-2 inline-block min-w-[120px] border-b-2 border-neutral-400 pb-1 text-center font-mono text-2xl font-bold">
                  {userInput
                    .split("")
                    .map((char, i) => (
                      <span
                        key={i}
                        className={showFeedback && char !== payload.answer[i] ? "text-red-500" : ""}
                      >
                        {char || " "}
                      </span>
                    ))
                    .join("") || "____"}
                </span>
              )}
            </span>
          ))}
        </div>

        {/* 입력된 단어 표시 */}
        {userInput && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center font-mono text-3xl font-bold text-indigo-600"
          >
            {userInput}
          </motion.div>
        )}
      </div>

      {/* 문자 버튼 그리드 */}
      <div className="grid grid-cols-4 gap-3">
        {availableLetters.map((letter, idx) => {
          const used = usedCounts.get(letter) || 0;
          const available = payload.poolLetters.filter((l) => l === letter).length;
          const disabled = used >= available || showFeedback;

          return (
            <Button
              key={`${letter}-${idx}`}
              variant="outline"
              onClick={() => handleLetterClick(letter)}
              disabled={disabled}
              className="h-14 text-lg font-semibold"
            >
              {letter}
            </Button>
          );
        })}
      </div>

      {/* 삭제 및 제출 버튼 */}
      <div className="flex gap-3">
        <Button
          variant="outline"
          onClick={handleDelete}
          disabled={selectedLetters.length === 0 || showFeedback}
          className="flex-1"
        >
          삭제
        </Button>
        <Button
          variant={canSubmit ? "default" : "outline"}
          onClick={handleSubmit}
          disabled={!canSubmit || showFeedback}
          className="flex-1 bg-indigo-600 text-white hover:bg-indigo-700"
        >
          제출
        </Button>
      </div>

      {/* 피드백 */}
      {showFeedback && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className={`rounded-2xl border p-6 text-center ${
            isCorrect
              ? "border-green-500 bg-green-50 text-green-800"
              : "border-red-500 bg-red-50 text-red-800"
          }`}
        >
          <div className="text-2xl font-bold">
            {isCorrect ? "✓ 정답입니다!" : "✗ 오답입니다"}
          </div>
          {!isCorrect && (
            <div className="mt-2 text-sm">정답: {payload.answer}</div>
          )}
        </motion.div>
      )}
    </div>
  );
}

