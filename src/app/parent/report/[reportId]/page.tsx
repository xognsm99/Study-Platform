"use client";

import { useEffect, useState } from "react";
import { getCategoryLabel } from "@/lib/utils/constants";

type RoundResult = {
  round: number;
  correct: number;
  wrong: number;
  total: number;
  timeMs: number;
  hintUsed: number;
};

type ReportData = {
  id: string;
  grade: string;
  subject: string;
  category: string;
  total: number;
  correct: number;
  wrong: number;
  scorePct: number;
  rank: string;
  elapsedTime: number;
  hintUsedCount: number;
  isTripleMode: boolean;
  roundResults: RoundResult[];
  createdAt: string;
};

function subjectLabel(subject: string) {
  if (subject === "english") return "영어";
  if (subject === "math") return "수학";
  return subject;
}

function categoryLabel(category: string) {
  return getCategoryLabel(category);
}

function formatTimeMs(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

function calcRank(scorePct: number): string {
  if (scorePct >= 90) return "A";
  if (scorePct >= 80) return "B";
  if (scorePct >= 70) return "C";
  if (scorePct >= 60) return "D";
  return "E";
}

function MiniBarChart({ values, maxValue, labels }: { values: number[]; maxValue: number; labels: string[] }) {
  return (
    <div className="flex items-end gap-2 h-24">
      {values.map((value, idx) => {
        const percentage = maxValue > 0 ? (value / maxValue) * 100 : 0;
        return (
          <div key={idx} className="flex-1 flex flex-col items-center">
            <div className="w-full bg-gray-100 rounded-t relative" style={{ height: "80px" }}>
              <div
                className="absolute bottom-0 w-full bg-blue-500 rounded-t transition-all"
                style={{ height: `${percentage}%` }}
              />
            </div>
            <div className="mt-1 text-xs text-gray-600">{labels[idx]}</div>
            <div className="text-xs font-semibold text-gray-900">{value}%</div>
          </div>
        );
      })}
    </div>
  );
}

export default function ParentReportPage({ params }: { params: Promise<{ reportId: string }> }) {
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [reportId, setReportId] = useState<string>("");

  useEffect(() => {
    params.then((p) => {
      setReportId(p.reportId);
      // localStorage에서 리포트 데이터 로드
      try {
        const stored = localStorage.getItem("lastParentReport");
        if (stored) {
          const data = JSON.parse(stored);
          if (data.id === p.reportId) {
            setReportData(data);
          }
        }
      } catch (e) {
        console.error("Failed to load report", e);
      }
    });
  }, [params]);

  if (!reportData) {
    return (
      <div className="mx-auto max-w-4xl p-6">
        <div className="rounded-2xl border bg-white p-6 text-slate-900">
          <p className="text-sm text-gray-600">학습 결과를 불러오는 중입니다...</p>
        </div>
      </div>
    );
  }

  const roundScorePcts = reportData.roundResults.map((r) =>
    Math.round((r.correct / Math.max(r.total, 1)) * 100)
  );

  return (
    <div className="mx-auto max-w-4xl p-6">
      <div className="rounded-2xl border bg-white p-6 shadow-sm text-slate-900">
        <div className="mb-4">
          <h1 className="text-2xl font-bold text-gray-900">학습 결과 리포트</h1>
          <p className="mt-1 text-sm text-gray-500">
            {reportData.grade} · {subjectLabel(reportData.subject)} · {categoryLabel(reportData.category)}
            {reportData.isTripleMode && " · 3회 세트"}
          </p>
          <p className="mt-1 text-xs text-gray-400">
            {new Date(reportData.createdAt).toLocaleString("ko-KR")}
          </p>
        </div>

        {/* 요약 카드 */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="rounded-xl border bg-white p-4">
            <div className="text-xs text-gray-500">정답률</div>
            <div className="mt-1 text-2xl font-bold">{reportData.scorePct}%</div>
          </div>
          <div className="rounded-xl border bg-white p-4">
            <div className="text-xs text-gray-500">레벨</div>
            <div className="mt-1 text-2xl font-bold">{calcRank(reportData.scorePct)}</div>
          </div>
          <div className="rounded-xl border bg-white p-4">
            <div className="text-xs text-gray-500">총 문항</div>
            <div className="mt-1 text-xl font-bold">{reportData.total}문항</div>
          </div>
          <div className="rounded-xl border bg-white p-4">
            <div className="text-xs text-gray-500">풀이 시간</div>
            <div className="mt-1 text-lg font-bold">{formatTimeMs(reportData.elapsedTime)}</div>
          </div>
        </div>

        {/* 3회 세트 그래프 */}
        {reportData.isTripleMode && reportData.roundResults.length === 3 && (
          <div className="mt-4 rounded-xl border bg-gray-50 p-4">
            <div className="text-sm font-semibold text-gray-700 mb-3">3회 세트 분석</div>
            
            {/* 정답률 그래프 */}
            <div className="mb-4">
              <div className="text-xs text-gray-600 mb-2">정답률 추이</div>
              <MiniBarChart
                values={roundScorePcts}
                maxValue={100}
                labels={["1회", "2회", "3회"]}
              />
            </div>

            {/* 상세 정보 */}
            <div className="grid grid-cols-3 gap-2 mt-4">
              {reportData.roundResults.map((r, idx) => {
                const roundScore = Math.round((r.correct / Math.max(r.total, 1)) * 100);
                return (
                  <div key={r.round} className="rounded-lg border bg-white p-3">
                    <div className="text-xs font-semibold text-gray-700">{idx + 1}회차</div>
                    <div className="mt-1 text-lg font-bold">{roundScore}%</div>
                    <div className="mt-1 text-xs text-gray-500">
                      정답: {r.correct} / {r.total}
                    </div>
                    <div className="mt-1 text-xs text-gray-500">
                      시간: {formatTimeMs(r.timeMs)}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 힌트 사용 정보 */}
        <div className="mt-4 rounded-xl border bg-blue-50 p-4">
          <div className="text-xs font-semibold text-blue-700">힌트 사용</div>
          <div className="mt-1 text-lg font-bold text-blue-900">{reportData.hintUsedCount}회</div>
        </div>

        {/* 프리미엄 안내 */}
        <div className="mt-4 rounded-xl border-2 border-amber-200 bg-amber-50 p-4">
          <div className="text-sm font-semibold text-amber-900 mb-2">프리미엄으로 더 많은 기능 이용하기</div>
          <ul className="space-y-1 text-xs text-amber-800 mb-3">
            <li>• 무제한 세트 생성</li>
            <li>• 나의 진행 상황 (누적 그래프)</li>
            <li>• 힌트 +3 추가</li>
            <li>• 주간 리포트 자동 제출</li>
          </ul>
          <button
            type="button"
            onClick={() => {
              alert("프리미엄 구독 기능은 준비 중입니다!");
            }}
            className="w-full rounded-lg bg-amber-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-amber-700"
          >
            프리미엄 구독하기
          </button>
        </div>
      </div>
    </div>
  );
}
