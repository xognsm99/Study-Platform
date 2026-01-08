type Props = {
  answer: string;        // 정답(= correctAnswer랑 같은 값이 들어올 수도 있음)
  value: string;         // 유저가 입력/인식한 값
  isActive: boolean;     // 현재 선택된 blank인지
  isRevealed: boolean;   // 채점 후 정답 공개 상태인지
  correctAnswer: string; // 정답(최종)
};

export default function UnderlineSlots({
  answer,
  value,
  isActive,
  isRevealed,
  correctAnswer,
}: Props) {
  const expectedRaw = (correctAnswer || answer || "").trim();
  const expectedLen = expectedRaw.length;

  // ✅ 표시용 언더바 개수: 정답 글자수 그대로 (최소2, 최대16)
  const displayLen = Math.min(16, Math.max(2, expectedLen || 5));

  // ✅ UI 폭: 너무 좁지 않게 최소 4ch
  const widthLen = Math.max(4, displayLen);

  // ✅ 표시할 값
  const displayText = (isRevealed ? expectedRaw : value).trim();

  // ✅ 빈칸이면 placeholder로 "____" 형태
  const content = displayText || "_".repeat(displayLen);

  // ✅ 스타일
  const baseClass =
    "inline-flex items-center justify-center gap-1 px-3 py-1 rounded-lg " +
    "transition-all select-none font-semibold text-base";

  const stateClass = isActive
    ? "bg-[#6E63D5]/10"
    : "";

  const textClass = displayText
    ? "text-[#2F2A57] tracking-wider"
    : "text-[#2F2A57]/45 font-mono tracking-[0.08em]";

  return (
    <span className={[baseClass, stateClass].join(" ")} style={{ minWidth: `${widthLen}ch` }}>
      <span className="text-[#2F2A57]/60 font-normal">(</span>
      <span className={textClass}>{content}</span>
      <span className="text-[#2F2A57]/60 font-normal">)</span>
    </span>
  );
}
