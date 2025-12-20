"use client";

import { ReactNode } from "react";
import Link from "next/link";

interface QuizCardProps {
  title: string;
  description?: string;
  difficulty?: "easy" | "medium" | "hard";
  questionCount?: number;
  timeLimit?: number; // 분 단위
  score?: number;
  maxScore?: number;
  href?: string;
  onClick?: () => void;
  children?: ReactNode;
  className?: string;
}

/**
 * 퀴즈 리스트 카드 UI
 */
export default function QuizCard({
  title,
  description,
  difficulty,
  questionCount,
  timeLimit,
  score,
  maxScore,
  href,
  onClick,
  children,
  className = "",
}: QuizCardProps) {
  const difficultyColors = {
    easy: "bg-green-500/20 text-green-300 border-green-500/30",
    medium: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
    hard: "bg-red-500/20 text-red-300 border-red-500/30",
  };

  const difficultyLabels = {
    easy: "쉬움",
    medium: "보통",
    hard: "어려움",
  };

  const content = (
    <div
      className={`
        glass-card rounded-2xl p-5
        hover:bg-white/15 hover:scale-[1.02]
        transition-all duration-200
        cursor-pointer
        ${className}
      `}
      onClick={onClick}
    >
      {/* 헤더 영역 */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1">
          <h3 className="text-lg font-bold text-white mb-1">{title}</h3>
          {description && (
            <p className="text-sm text-white/70 line-clamp-2">{description}</p>
          )}
        </div>
        {difficulty && (
          <span
            className={`
              px-2 py-1 rounded-lg text-xs font-semibold border
              ${difficultyColors[difficulty]}
            `}
          >
            {difficultyLabels[difficulty]}
          </span>
        )}
      </div>

      {/* 메타 정보 */}
      <div className="flex items-center gap-3 mb-3 flex-wrap">
        {questionCount !== undefined && (
          <div className="flex items-center gap-1 text-sm text-white/80">
            <span>📝</span>
            <span>{questionCount}문제</span>
          </div>
        )}
        {timeLimit !== undefined && (
          <div className="flex items-center gap-1 text-sm text-white/80">
            <span>⏱️</span>
            <span>{timeLimit}분</span>
          </div>
        )}
        {score !== undefined && maxScore !== undefined && (
          <div className="flex items-center gap-1 text-sm text-white/80">
            <span>⭐</span>
            <span>
              {score} / {maxScore}
            </span>
          </div>
        )}
      </div>

      {/* 커스텀 컨텐츠 */}
      {children}
    </div>
  );

  if (href) {
    return <Link href={href}>{content}</Link>;
  }

  return content;
}

