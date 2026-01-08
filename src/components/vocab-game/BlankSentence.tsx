"use client";

import React, { Fragment } from "react";
import UnderlineSlots from "./UnderlineSlots";

interface BlankSentenceProps {
  sentence: string; // 빈칸 토큰: ( ) / () / （ ） 등
  userAnswers: string[];
  activeBlankIndex: number;
  answers: string[];
  revealed: boolean[];
  onBlankClick?: (i: number) => void;
}

// ✅ 빈칸 토큰 후보들: () / ( ) / (　) / （ ） / （　）
const PLACEHOLDER_SPLIT = /(\(\s*\)|（\s*）)/g;
// split에 쓰는 정규식은 g가 필요하지만, placeholder 판별은 g 없는 걸로 안전하게
const PLACEHOLDER_TEST = /^(\(\s*\)|（\s*）)$/;

export default function BlankSentence({
  sentence,
  userAnswers,
  activeBlankIndex,
  answers,
  revealed,
  onBlankClick,
}: BlankSentenceProps) {
  // ✅ placeholder 자체도 tokens 배열에 남겨서, 그 자리만 UnderlineSlots로 치환
  const tokens = sentence.split(PLACEHOLDER_SPLIT);

  let blankIndex = -1;

  return (
    <div className="w-full">
      <p className="text-center text-[18px] md:text-[20px] text-[#2F2A57] leading-relaxed break-words">
        {tokens.map((token, idx) => {
          const isBlank = PLACEHOLDER_TEST.test(token);

          if (!isBlank) {
            // 일반 텍스트
            return (
              <Fragment key={`t-${idx}`}>
                {token}
              </Fragment>
            );
          }

          // 빈칸 자리
          blankIndex += 1;
          const i = blankIndex;
          
          return (
            <span key={`b-${idx}`} className="inline-block align-middle mx-1">
              <button
                type="button"
                onClick={() => onBlankClick?.(i)}
                className="inline-block"
              >
                <UnderlineSlots
                  answer={answers?.[i] ?? ""}
                  value={userAnswers?.[i] ?? ""}
                  isActive={activeBlankIndex === i}
                  isRevealed={revealed?.[i] ?? false}
                  correctAnswer={answers?.[i] ?? ""}
                />
              </button>
            </span>
          );
        })}
      </p>
    </div>
  );
}
