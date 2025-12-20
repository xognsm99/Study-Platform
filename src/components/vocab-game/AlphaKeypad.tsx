"use client";

interface AlphaKeypadProps {
  letters: string[];
  onKeyPress: (letter: string) => void;
  onBackspace: () => void;
  onHint?: () => void;
  onReveal?: () => void;
  disabled?: boolean;
}

/**
 * 알파벳 키패드 컴포넌트
 */
export default function AlphaKeypad({
  letters,
  onKeyPress,
  onBackspace,
  onHint,
  onReveal,
  disabled = false,
}: AlphaKeypadProps) {
  return (
    <div className="w-full max-w-2xl mx-auto px-4 pb-8">
      {/* 알파벳 키 버튼들 */}
      <div className="grid grid-cols-6 md:grid-cols-8 gap-2 mb-4">
        {letters.map((letter) => (
          <button
            key={letter}
            onClick={() => onKeyPress(letter)}
            disabled={disabled}
            className={`
              h-12 md:h-14 
              text-lg md:text-xl font-semibold
              rounded-xl border transition-all
              ${
                disabled
                  ? "border-[#E7E5FF] bg-white/60 text-[#2F2A57]/30 cursor-not-allowed"
                  : "border-[#E7E5FF] bg-white/70 text-[#2F2A57] ring-2 ring-[#E7E5FF] hover:ring-[#B9B4E4] hover:bg-white/80 active:scale-95"
              }
            `}
          >
            {letter}
          </button>
        ))}
      </div>

      {/* Backspace 및 Hint 버튼 */}
      <div className="flex gap-4 justify-center">
        <button
          onClick={onBackspace}
          disabled={disabled}
          className={`
            px-6 py-3 
            text-base font-semibold
            rounded-xl border transition-all
            ${
              disabled
                ? "border-[#E7E5FF] bg-white/60 text-[#2F2A57]/30 cursor-not-allowed"
                : "border-[#E7E5FF] bg-white/70 text-[#2F2A57] ring-2 ring-[#E7E5FF] hover:ring-[#B9B4E4] hover:bg-white/80"
            }
          `}
        >
          ← Backspace
        </button>

        {onHint && (
          <button
            onClick={onHint}
            disabled={disabled}
            className={`
              px-6 py-3 
              text-base font-semibold
              rounded-xl border transition-all
              ${
                disabled
                  ? "border-[#E7E5FF] bg-white/60 text-[#2F2A57]/30 cursor-not-allowed"
                  : "border-[#E7E5FF] bg-white/70 text-[#2F2A57] ring-2 ring-[#E7E5FF] hover:ring-[#B9B4E4] hover:bg-white/80"
              }
            `}
          >
            💡 Hint (-1점)
          </button>
        )}

        {onReveal && (
          <button
            type="button"
            onClick={onReveal}
            disabled={disabled}
            className={`
              px-6 py-3 
              text-base font-semibold
              rounded-xl transition-all
              ${
                disabled
                  ? "bg-white/60 text-[#2F2A57]/30 cursor-not-allowed"
                  : "bg-[#6E63D5] text-white hover:bg-[#5B52C8] active:bg-[#5B52C8] shadow-md"
              }
            `}
          >
            👀 정답 보기 (0점)
          </button>
        )}
      </div>
    </div>
  );
}

