"use client";

interface BlankSentenceProps {
  sentence: string;
  userAnswers: string[];
  activeBlankIndex: number;
  answers: string[];
  revealed?: boolean[];
  onBlankClick: (index: number) => void;
}

/**
 * 빈칸 문장 표시 컴포넌트
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
    <div className="text-xl md:text-2xl leading-relaxed text-center px-4 py-8 text-slate-900 dark:text-slate-100">
      {parts.map((part, index) => (
        <span key={index}>
          <span className="text-slate-900 dark:text-slate-100">{part}</span>
          {index < blankCount && (
            <span className="inline-block mx-1">
              <button
                onClick={() => onBlankClick(index)}
                className={`
                  inline-block min-w-[80px] md:min-w-[120px] h-10 md:h-12 px-2 
                  border-2 rounded-lg transition-all
                  ${
                    activeBlankIndex === index
                      ? "ring-2 ring-blue-500 border-blue-500 bg-blue-50 dark:bg-blue-950/40"
                      : "border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100"
                  }
                  hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40
                  focus:outline-none focus:ring-2 focus:ring-blue-400
                `}
              >
                <span
                  className={`${
                    userAnswers[index]
                      ? "text-slate-900 dark:text-slate-100 font-semibold"
                      : "text-slate-500 dark:text-slate-400"
                  }`}
                >
                  {userAnswers[index] || "______"}
                </span>
              </button>
              {revealed && revealed[index] && (
                <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 text-center">
                  정답: {answers[index]}
                </div>
              )}
            </span>
          )}
        </span>
      ))}
    </div>
  );
}

