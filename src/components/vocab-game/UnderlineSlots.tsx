"use client";

interface UnderlineSlotsProps {
  answer: string;
  value: string;
  isActive?: boolean;
  isRevealed?: boolean;
  correctAnswer?: string;
}

/**
 * 정답 길이만큼 슬롯을 표시하는 컴포넌트 (왼쪽 정렬)
 */
export default function UnderlineSlots({
  answer,
  value,
  isActive = false,
  isRevealed = false,
  correctAnswer,
}: UnderlineSlotsProps) {
  const len = answer?.length ?? 0;
  const chars = Array.from({ length: len }, (_, i) => value?.[i] ?? "");

  return (
    <div className="flex flex-wrap items-center justify-start gap-1 md:gap-2">
      {chars.map((ch, i) => (
        <div
          key={i}
          className={`
            h-10 md:h-10 w-8 md:w-9
            rounded-md border-2 text-center
            text-xl md:text-2xl font-bold
            shadow-sm backdrop-blur-sm
            transition-all
            ${
              isActive
                ? "ring-2 ring-[#B9B4E4] border-[#B9B4E4] bg-white/70"
                : "border-[#E7E5FF] bg-white/70"
            }
          `}
        >
          <div className="leading-[2.5rem] md:leading-[3rem] text-[#2F2A57] font-mono">
            {isRevealed && correctAnswer
              ? (correctAnswer[i]?.toLowerCase() || "_")
              : ch
                ? ch.toLowerCase()
                : "_"}
          </div>
        </div>
      ))}
    </div>
  );
}
