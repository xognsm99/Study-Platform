"use client";

import UnderlineSlots from "./UnderlineSlots";

interface BlankSentenceProps {
  sentence: string;
  userAnswers: string[];
  activeBlankIndex: number;
  answers: string[];
  revealed?: boolean[];
  onBlankClick: (index: number) => void;
}

/**
 * 빈칸 문장 표시 컴포넌트 (퍼플 테마 + 언더바 표시)
 */
export default function BlankSentence({
  sentence,
  userAnswers,
  activeBlankIndex,
  answers,
  revealed,
  onBlankClick,
}: BlankSentenceProps) {
  // 문장을 빈칸 기준으로 분할
  const parts = sentence.split("()");
  const blankCount = parts.length - 1;

  return (
    <div className="text-xl md:text-2xl leading-relaxed text-center px-4 py-8 text-[#2F2A57]">
      {parts.map((part, index) => (
        <span key={index}>
          <span className="text-[#2F2A57] drop-shadow-sm">{part}</span>
          {index < blankCount && (
            <span className="inline-block mx-2">
              <button
                onClick={() => onBlankClick(index)}
                className="inline-block transition-all focus:outline-none focus:ring-2 focus:ring-[#B9B4E4] rounded-xl"
              >
                <UnderlineSlots
                  answer={answers[index]}
                  value={userAnswers[index] || ""}
                  isActive={activeBlankIndex === index}
                  isRevealed={revealed?.[index] || false}
                  correctAnswer={revealed?.[index] ? answers[index] : undefined}
                />
              </button>
            </span>
          )}
        </span>
      ))}
    </div>
  );
}

