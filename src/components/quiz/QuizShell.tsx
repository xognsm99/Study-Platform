"use client";

import { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";

type QuizShellProps = {
  currentIndex: number;
  totalCount: number;
  onBack?: () => void;
  showTimer?: boolean;
  elapsedSeconds?: number;
  showPause?: boolean;
  onPause?: () => void;
  children: ReactNode;
};

export default function QuizShell({
  currentIndex,
  totalCount,
  onBack,
  showTimer = false,
  elapsedSeconds = 0,
  showPause = false,
  onPause,
  children,
}: QuizShellProps) {
  const router = useRouter();
  const progress = totalCount > 0 ? ((currentIndex + 1) / totalCount) * 100 : 0;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  return (
    <div className="min-h-screen bg-[#F6F5FF]">
      {/* 상단 헤더 */}
      <div className="sticky top-0 z-10 border-b border-blue-200/60 bg-white/70 backdrop-blur-sm">
        <div className="mx-auto max-w-2xl px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={onBack || (() => router.back())}
                className="flex items-center text-sm text-[#1e3a8a] hover:text-[#1e40af]"

              >
                ← 뒤로
              </button>
              <div className="text-sm font-medium text-[#2F2A57]">
                {currentIndex + 1} / {totalCount}
              </div>
            </div>
            <div className="flex items-center gap-4">
              {showTimer && (
                <div className="text-sm font-mono text-[#2F2A57]">
                  {formatTime(elapsedSeconds)}
                </div>
              )}
              {showPause && onPause && (
                <button
                  onClick={onPause}
                  className="text-sm text-[#2F2A57] hover:text-[#6E63D5]"
                >
                  일시정지
                </button>
              )}
            </div>
          </div>
          <div className="mt-2">
            <Progress value={progress} />
          </div>
        </div>
      </div>

      {/* 중앙 콘텐츠 */}
      <div className="mx-auto max-w-2xl px-4 py-8 overflow-visible">{children}</div>
    </div>
  );
}

