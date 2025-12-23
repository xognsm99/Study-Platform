"use client";

import React, { Fragment } from "react";
import UnderlineSlots from "./UnderlineSlots";

interface BlankSentenceProps {
  sentence: string; // 빈칸 토큰: "()"
  userAnswers: string[];
  activeBlankIndex: number;
  answers: string[];
  revealed: boolean[];
  onBlankClick?: (i: number) => void;
}

export default function BlankSentence({
  sentence,
  userAnswers,
  activeBlankIndex,
  answers,
  revealed,
  onBlankClick,
}: BlankSentenceProps) {
  const parts = sentence.split("()");

  return (
    <div className="w-full">
      {/* ✅ flex로 쪼개지 말고, 문장 흐름 그대로 렌더 */}
      <p className="text-center text-[18px] md:text-[20px] text-[#2F2A57] leading-relaxed break-words">
        {parts.map((text, i) => {
          const hasBlank = i < parts.length - 1;

          return (
            <Fragment key={`seg-${i}`}>
              {text}

              {hasBlank ? (
                <span className="inline-block align-middle mx-1">
                  <button
                    type="button"
                    onClick={() => onBlankClick?.(i)}
                    className="inline-block"
                  >
                    <UnderlineSlots
                      answer={answers[i] ?? ""}
                      value={userAnswers[i] ?? ""}
                      isActive={activeBlankIndex === i}
                      isRevealed={revealed?.[i] ?? false}
                      correctAnswer={answers[i] ?? ""}
                    />
                  </button>
                </span>
              ) : null}
            </Fragment>
          );
        })}
      </p>
    </div>
  );
}
