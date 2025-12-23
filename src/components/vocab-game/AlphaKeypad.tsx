"use client";

import { useEffect, useMemo, useState } from "react";

interface AlphaKeypadProps {
  letters?: string[];
  onKeyPress: (letter: string) => void;
  onBackspace: () => void;
  onHint?: () => void;
  onReveal?: () => void;
  disabled?: boolean;
}

export default function AlphaKeypad({
  letters = [],
  onKeyPress,
  onBackspace,
  onHint,
  onReveal,
  disabled = false,
}: AlphaKeypadProps) {
  // ✅ 하이드레이션 안정화(랜덤/불안정 렌더 방지용)
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // ✅ 안전 처리: undefined 방지 + 중복 제거 + 소문자 통일
  // ✅ 첫 렌더는 항상 동일한 순서(정렬)로 렌더링
  const displayLetters = useMemo(() => {
    const arr = Array.isArray(letters) ? letters : [];
    const uniq = Array.from(
      new Set(
        arr
          .map((x) => String(x ?? "").trim().toLowerCase())
          .filter(Boolean)
      )
    );
    uniq.sort(); // SSR/CSR 첫 렌더 동일하게 고정
    return uniq;
  }, [letters]);

  // mounted는 지금은 UI 변화에 안 쓰지만(랜덤 안 하니까),
  // 혹시 미래에 마운트 후 동작을 넣더라도 hydration 안정화 프레임 유지
  void mounted;

  return (
    <div className="w-full max-w-2xl mx-auto px-4 pb-8">
      {/* 알파벳 선택 */}
      <div className="grid grid-cols-6 gap-2 mb-4">
        {displayLetters.map((letter) => (
          <button
            key={letter}
            type="button"
            onClick={() => onKeyPress(letter)}
            disabled={disabled}
            className={[
              "h-12 rounded-2xl border text-lg font-semibold",
              "bg-white/70 active:scale-[0.98] transition",
              "disabled:opacity-40 disabled:cursor-not-allowed",
              "border-[#DAD7F3] text-[#1F1F1F]",
            ].join(" ")}
          >
            {letter}
          </button>
        ))}
      </div>

      {/* 하단 컨트롤: 백스페이스 / 힌트 / 정답보기 */}
      <div className="flex items-center justify-center gap-3">
        <button
          type="button"
          onClick={onBackspace}
          disabled={disabled}
          className="h-14 w-20 rounded-2xl bg-white border-2 border-[#B9B4E4] text-[#2F2A57] text-2xl font-black shadow-sm active:scale-[0.98] transition disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center"
          aria-label="Backspace"
          title="Backspace"
        >
          ←
        </button>

        {onHint && (
          <button
            type="button"
            onClick={onHint}
            disabled={disabled}
            className="h-14 w-20 rounded-2xl bg-white border-2 border-[#B9B4E4] text-[#2F2A57] text-2xl font-black shadow-sm active:scale-[0.98] transition disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center"
            aria-label="Hint"
            title="Hint (-1)"
          >
            💡
          </button>
        )}

        {onReveal && (
          <button
            type="button"
            onClick={onReveal}
            disabled={disabled}
            className="h-14 w-20 rounded-2xl bg-[#6E63D5] text-white text-xl shadow-md active:scale-[0.98] transition disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center"
            aria-label="Reveal"
            title="Reveal (-2)"
          >
            👀
          </button>
        )}
      </div>
    </div>
  );
}
