"use client";

import { useRouter, useParams, useSearchParams } from "next/navigation";
import { Suspense } from "react";

function ResultContent() {
  const router = useRouter();
  const params = useParams<{ locale: string }>();
  const searchParams = useSearchParams();
  const locale = params?.locale || "ko";

  // 방어 코딩: NaN 방지
  const scoreParam = searchParams.get("score") || "0";
  const totalParam = searchParams.get("total") || "20";
  const hintParam = searchParams.get("hint") || "0";
  const revealParam = searchParams.get("reveal") || "0";

  const scoreNum = Number(scoreParam);
  const totalNum = Number(totalParam);
  const hintNum = Number(hintParam);
  const revealNum = Number(revealParam);

  // NaN이면 기본값으로 대체, 범위 제한
  const safeTotal = Number.isFinite(totalNum) && totalNum > 0 ? totalNum : 20;
  const safeScore = Number.isFinite(scoreNum) ? Math.min(Math.max(0, scoreNum), safeTotal) : 0;
  const safeHint = Number.isFinite(hintNum) && hintNum >= 0 ? hintNum : 0;
  const safeReveal = Number.isFinite(revealNum) && revealNum >= 0 ? revealNum : 0;

  const percentage = Math.round((safeScore / safeTotal) * 100);

  // 기존 쿼리 파라미터 유지 (grade, subject, region, school, unit 등)
  const preservedParams = new URLSearchParams();
  searchParams.forEach((value, key) => {
    if (key !== "score" && key !== "total") {
      preservedParams.set(key, value);
    }
  });

  const handleRetry = () => {
    const queryString = preservedParams.toString();
    router.push(`/${locale}/student/vocab-game${queryString ? `?${queryString}` : ""}`);
  };

  const handleBack = () => {
    router.back();
  };

  return (
    <div className="min-h-screen bg-[#F5F3FF]">
      <div className="max-w-[520px] mx-auto p-2">
        {/* 보라 헤더 바 */}
        <div className="bg-[#6E63D5] text-white rounded-none px-3 py-3 flex items-center justify-between mb-5 w-full">
          <button
            onClick={handleBack}
            className="text-sm font-medium opacity-95"
          >
            ← 뒤로가기
          </button>

          <div className="text-[18px] md:text-[24px] font-semibold tracking-tight">
            단어 게임 퀴즈 결과
          </div>

          <div className="w-16"></div>
        </div>

        {/* 결과 카드 */}
        <div className="rounded-3xl bg-white/80 p-8 border border-[#E6E3FA] mb-4">
          <div className="text-center">
            <div className="text-6xl mb-4">
              {percentage >= 90 ? "🎉" : percentage >= 70 ? "👍" : percentage >= 50 ? "😊" : "💪"}
            </div>

            <h2 className="text-2xl font-bold text-[#6E63D5] mb-2">
              {percentage >= 90 ? "완벽해요!" : percentage >= 70 ? "잘했어요!" : percentage >= 50 ? "괜찮아요!" : "다시 도전!"}
            </h2>

            <p className="text-gray-600 mb-6">
              {percentage >= 90 ? "모든 문제를 잘 풀었습니다!" : percentage >= 70 ? "조금만 더 노력하면 완벽해요!" : percentage >= 50 ? "계속 연습하면 더 잘할 수 있어요!" : "포기하지 말고 다시 도전해봐요!"}
            </p>

            <div className="bg-[#F3F1FF] rounded-2xl p-6 mb-6">
              <div className="text-5xl font-bold text-[#6E63D5] mb-2">
                {safeScore} <span className="text-2xl text-gray-500">/ {safeTotal}</span>
              </div>
              <div className="text-sm text-gray-600">획득 점수</div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-[#F3F1FF] rounded-xl p-4">
                <div className="text-2xl font-bold text-[#6E63D5]">{percentage}%</div>
                <div className="text-xs text-gray-600 mt-1">정답률</div>
              </div>
              <div className="bg-[#F3F1FF] rounded-xl p-4">
                <div className="text-base font-bold text-[#6E63D5]">힌트 {safeHint}회</div>
                <div className="text-sm font-semibold text-[#8B7BD8] mt-1">정답보기 {safeReveal}회</div>
              </div>
            </div>
          </div>
        </div>

        {/* 버튼 */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={handleRetry}
            className="px-6 py-4 rounded-xl text-sm font-semibold bg-[#6E63D9] text-white shadow-sm active:scale-[0.98] transition-all"
          >
            다시하기
          </button>
          <button
            onClick={handleBack}
            className="px-6 py-4 rounded-xl text-sm font-semibold bg-white/80 text-[#6E63D5] border border-[#E6E3FA] active:scale-[0.98] transition-all"
          >
            돌아가기
          </button>
        </div>
      </div>
    </div>
  );
}

export default function VocabGameResultPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#F5F3FF] flex items-center justify-center">
        <div className="text-[#6E63D5] font-semibold">결과 로딩 중...</div>
      </div>
    }>
      <ResultContent />
    </Suspense>
  );
}
