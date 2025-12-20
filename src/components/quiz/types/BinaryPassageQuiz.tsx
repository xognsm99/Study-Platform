"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import type { BinaryPassagePayload } from "@/lib/quiz/schema";
import { Button } from "@/components/ui/button";

type BinaryPassageQuizProps = {
  payload: BinaryPassagePayload;
  onAnswer: (questionId: number, answerIndex: number) => void;
  onSubmit?: () => void;
  answers: (number | null)[];
  showFeedback?: boolean;
};

export default function BinaryPassageQuiz({
  payload,
  onAnswer,
  onSubmit,
  answers,
  showFeedback = false,
}: BinaryPassageQuizProps) {
  const [submitted, setSubmitted] = useState(false);

  const handleSelect = (questionId: number, answerIndex: number) => {
    if (submitted || showFeedback) return;
    onAnswer(questionId, answerIndex);
  };

  const handleSubmit = () => {
    if (answers.some((a) => a === null)) {
      alert("모든 문제에 답을 선택해주세요.");
      return;
    }
    setSubmitted(true);
    if (onSubmit) {
      onSubmit();
    }
  };

  return (
    <div className="space-y-6">
      {/* 지문 카드 */}
      <div className="max-h-64 overflow-y-auto rounded-2xl border border-neutral-200 bg-white p-6">
        <div className="whitespace-pre-wrap text-base leading-relaxed text-neutral-700">
          {payload.passage}
        </div>
      </div>

      {/* 문제들 */}
      <div className="space-y-4">
        {payload.questions.map((question, qIdx) => {
          const selectedIndex = answers[qIdx];
          const isCorrect = selectedIndex === question.answerIndex;
          const showResult = submitted && showFeedback;

          return (
            <motion.div
              key={question.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: qIdx * 0.1 }}
              className="rounded-2xl border border-neutral-200 bg-white p-6"
            >
              <div className="mb-4 text-base font-medium text-neutral-900">
                {qIdx + 1}. {question.text}
              </div>
              <div className="grid grid-cols-2 gap-3">
                {question.options.map((option, optIdx) => {
                  const isSelected = selectedIndex === optIdx;
                  const showCorrect = showResult && optIdx === question.answerIndex;
                  const showWrong = showResult && isSelected && !isCorrect;

                  return (
                    <Button
                      key={optIdx}
                      variant={isSelected ? "default" : "outline"}
                      onClick={() => handleSelect(question.id, optIdx)}
                      disabled={submitted || showFeedback}
                      className={`h-14 text-base ${
                        showCorrect
                          ? "bg-green-500 text-white hover:bg-green-600"
                          : showWrong
                            ? "border-red-500 text-red-600 hover:bg-red-50"
                            : isSelected
                              ? "bg-indigo-600 text-white hover:bg-indigo-700"
                              : ""
                      }`}
                    >
                      {optIdx === 0 ? "A" : "B"}. {option}
                      {showCorrect && <span className="ml-2">✓</span>}
                      {showWrong && <span className="ml-2">✗</span>}
                    </Button>
                  );
                })}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* 제출 버튼 */}
      {!submitted && (
        <Button
          onClick={handleSubmit}
          disabled={answers.some((a) => a === null)}
          className="w-full bg-indigo-600 text-white hover:bg-indigo-700"
        >
          제출하기
        </Button>
      )}
    </div>
  );
}

