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
              rounded-lg border-2 transition-all
              ${
                disabled
                  ? "border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900/50 text-slate-400 dark:text-slate-500 cursor-not-allowed"
                  : "border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-blue-400 active:bg-blue-100 active:border-blue-500"
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
            rounded-lg border-2 transition-all
            ${
              disabled
                ? "border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900/50 text-slate-400 dark:text-slate-500 cursor-not-allowed"
                : "border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-100 hover:bg-slate-200 dark:hover:bg-slate-700 hover:border-slate-400 active:bg-slate-300"
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
              rounded-lg border-2 transition-all
              ${
                disabled
                  ? "border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900/50 text-slate-400 dark:text-slate-500 cursor-not-allowed"
                  : "border-amber-300 dark:border-amber-500/40 bg-amber-50 dark:bg-amber-950/30 text-amber-900 dark:text-amber-100 hover:bg-amber-100 dark:hover:bg-amber-950/40 hover:border-amber-400 active:bg-amber-200"
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
              rounded-lg border-2 transition-all
              ${
                disabled
                  ? "border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900/50 text-slate-400 dark:text-slate-500 cursor-not-allowed"
                  : "border-purple-300 dark:border-purple-500/40 bg-purple-50 dark:bg-purple-950/30 text-purple-900 dark:text-purple-100 hover:bg-purple-100 dark:hover:bg-purple-950/40 hover:border-purple-400 active:bg-purple-200"
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

