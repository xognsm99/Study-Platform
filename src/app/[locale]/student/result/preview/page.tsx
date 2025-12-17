"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import ResultCard from "@/components/ResultCard";
import { getCategoryLabel } from "@/lib/utils/constants";

type RoundResult = {
  round: number;
  correct: number;
  wrong: number;
  total: number;
  timeMs: number;
  hintUsed: number;
};

type PreviewData = {
  correctCount: number;
  wrongCount: number;
  totalCount: number;
  score: number;
  totalTimeMs: number;
  hintUsedCount: number;
  meta: {
    grade: string;
    subject: string;
    category: string;
    schoolName: string | null;
    timestamp: number;
    isTripleMode: boolean;
    round?: number;
    roundResults?: RoundResult[];
  };
};

export default function ResultPreviewPage() {
  const router = useRouter();
  const [previewData, setPreviewData] = useState<PreviewData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("lastResultPreview");
      if (stored) {
        const parsed = JSON.parse(stored) as PreviewData;
        setPreviewData(parsed);
      }
    } catch (e) {
      console.error("Failed to load result preview", e);
    } finally {
      setLoading(false);
    }
  }, []);

  // 데이터 없음 화면
  if (!loading && !previewData) {
    return (
      <div className="mx-auto max-w-4xl p-6">
        <div className="rounded-2xl border bg-white p-8 text-center text-slate-900">
          <h1 className="text-xl font-semibold mb-2">아직 미리볼 결과가 없습니다.</h1>
          <p className="text-sm text-gray-600 mb-6">
            문제를 1개 이상 풀어주세요.
          </p>
          <button
            onClick={() => {
              const pathname = window.location.pathname;
              const locale = pathname.split("/")[1] || "ko";
              router.push(`/${locale}/student/setup`);
            }}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700"
          >
            문제 풀기로 이동
          </button>
        </div>
      </div>
    );
  }

  // 로딩 화면
  if (loading) {
    return (
      <div className="mx-auto max-w-4xl p-6">
        <div className="rounded-2xl border bg-white p-8 text-center text-slate-900">
          <div className="animate-pulse space-y-3">
            <div className="h-4 w-1/3 mx-auto rounded bg-gray-200" />
            <div className="h-6 w-full rounded bg-gray-200" />
            <div className="h-10 w-full rounded bg-gray-200" />
          </div>
          <p className="mt-4 text-sm text-gray-500">결과를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (!previewData) return null;

  const { meta } = previewData;
  const isTripleMode = meta.isTripleMode && meta.roundResults && meta.roundResults.length > 0;

  return (
    <div className="mx-auto max-w-4xl p-6">
      <div className="mb-4">
        <button
          onClick={() => {
            const pathname = window.location.pathname;
            const locale = pathname.split("/")[1] || "ko";
            router.back();
          }}
          className="text-sm text-blue-600 hover:text-blue-700"
        >
          ← 돌아가기
        </button>
      </div>

      <ResultCard
        total={previewData.totalCount}
        correct={previewData.correctCount}
        wrong={previewData.wrongCount}
        grade={meta.grade}
        subject={meta.subject}
        category={meta.category}
        elapsedTime={Math.floor(previewData.totalTimeMs / 1000)}
        hintUsedCount={previewData.hintUsedCount}
        isTripleMode={isTripleMode}
        roundResults={isTripleMode && meta.roundResults ? meta.roundResults : []}
        onRetry={() => {
          const pathname = window.location.pathname;
          const locale = pathname.split("/")[1] || "ko";
          router.push(`/${locale}/student/setup`);
        }}
        onNewProblems={() => {
          const pathname = window.location.pathname;
          const locale = pathname.split("/")[1] || "ko";
          router.push(`/${locale}/student/setup`);
        }}
      />
    </div>
  );
}