"use client";

import React, { useEffect, useMemo, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase-browser";

type LeaderRow = {
  rank: number;
  name: string;
  points: number;
  badge?: "gold" | "silver" | "bronze";
};

type WeakQtype = {
  qtype: string;
  acc: number;
  attempts: number;
};

type TodayPlanItem = {
  title: string;
  desc: string;
};

type LeaderboardRow = {
  name: string;
  points: number;
  rank: number;
};

type ReportData = {
  userName: string;
  points: number;
  played: number;
  correct: number;
  accuracyPct: number;
  createdProblems: number;
  monthlyGoal: number;
  period: string;
  weakQtypes?: WeakQtype[];
  todayPlan?: TodayPlanItem[];
  leaderboardWorld?: LeaderboardRow[];
  leaderboardLocal?: LeaderboardRow[];
};

export default function StudentReportPage() {
  const [period, setPeriod] = useState<"weekly" | "monthly">("monthly");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [leaderboardMode, setLeaderboardMode] = useState<"world" | "local">("world");

  const userName = reportData?.userName || "학생";
  const points = reportData?.points || 0;
  const monthlyGoal = reportData?.monthlyGoal || 50;
  const playedThisMonth = reportData?.played || 0;
  const accuracyPct = reportData?.accuracyPct || 0;

  const progressPct = Math.min(100, Math.round((playedThisMonth / monthlyGoal) * 100));

  // 데이터 로드
  useEffect(() => {
    const fetchReport = async () => {
      try {
        setLoading(true);
        setError(null);

        const supabase = supabaseBrowser();
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          setError("로그인이 필요합니다.");
          setLoading(false);
          return;
        }

        const res = await fetch(`/api/student-report?userId=${user.id}&period=${period}`);
        const json = await res.json();

        if (!json.ok) {
          setError(json.error || "데이터를 불러오지 못했습니다.");
          setLoading(false);
          return;
        }

        setReportData(json.data);
        setLoading(false);
      } catch (e: any) {
        console.error("student report fetch error:", e);
        setError(e?.message || "알 수 없는 오류");
        setLoading(false);
      }
    };

    fetchReport();
  }, [period]);

  const leaderboard: LeaderRow[] = useMemo(() => {
    const activeLeaderboard =
      leaderboardMode === "world" ? reportData?.leaderboardWorld : reportData?.leaderboardLocal;

    if (activeLeaderboard && activeLeaderboard.length > 0) {
      return activeLeaderboard.map((row, idx) => ({
        rank: row.rank,
        name: row.name,
        points: row.points,
        badge:
          idx === 0 ? ("gold" as const) : idx === 1 ? ("silver" as const) : idx === 2 ? ("bronze" as const) : undefined,
      }));
    }

    // Fallback to placeholder
    return [
      { rank: 1, name: "Davis", points: 2569, badge: "gold" },
      { rank: 2, name: "Alena", points: 1469, badge: "silver" },
      { rank: 3, name: "Craig", points: 1053, badge: "bronze" },
      { rank: 4, name: userName, points: points },
      { rank: 5, name: "Zain", points: 448 },
    ];
  }, [reportData, leaderboardMode, userName, points]);

  const advice = useMemo(() => {
    if (reportData?.todayPlan && reportData.todayPlan.length > 0) {
      return reportData.todayPlan;
    }

    // Fallback
    return [
      { title: "오늘 10문항", desc: "문법(빈칸) 10문항만 풀고 마무리하세요." },
      { title: "약점 보완", desc: "최근 오답이 많은 유형: 본문 일치 → 내일 15문항 추천" },
      { title: "루틴", desc: "3일 연속 학습을 만들면 점수가 안정적으로 오릅니다." },
    ];
  }, [reportData]);

  // 로딩 중
  if (loading) {
    return (
      <div className="px-4 pt-4 pb-24 max-[380px]:px-3 max-[380px]:pt-3">
        <div className="mx-auto w-full max-w-md">
          <div className="flex items-center justify-between">
            <h1 className="text-lg font-semibold text-[#2B245A] max-[380px]:text-base">
              학습 리포트(준비중)
            </h1>
          </div>
          <div className="mt-6 rounded-2xl bg-white p-8 shadow-[0_2px_8px_rgba(0,0,0,0.06)] text-center">
            <div className="text-sm text-gray-500">데이터를 불러오는 중...</div>
          </div>
        </div>
      </div>
    );
  }

  // 에러 발생
  if (error) {
    return (
      <div className="px-4 pt-4 pb-24 max-[380px]:px-3 max-[380px]:pt-3">
        <div className="mx-auto w-full max-w-md">
          <div className="flex items-center justify-between">
            <h1 className="text-lg font-semibold text-[#2B245A] max-[380px]:text-base">
              학습 리포트(준비중)
            </h1>
          </div>
          <div className="mt-6 rounded-2xl bg-white p-8 shadow-[0_2px_8px_rgba(0,0,0,0.06)] text-center">
            <div className="text-sm text-red-600 mb-4">{error}</div>
            <button
              onClick={() => window.location.reload()}
              className="rounded-full bg-[#6E63D5] px-4 py-2 text-sm text-white hover:bg-[#584FAA]"
            >
              다시 시도
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 pt-4 pb-24 max-[380px]:px-3 max-[380px]:pt-3">
      <div className="mx-auto w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-semibold text-[#2B245A] max-[380px]:text-base">
            학습 리포트(준비중)
          </h1>

          <button
            type="button"
            className="rounded-full border border-[#D9D5F6] bg-white/70 px-3 py-1.5 text-xs text-[#2B245A]/80"
            onClick={() => setPeriod((p) => (p === "monthly" ? "weekly" : "monthly"))}
          >
            {period === "monthly" ? "월간" : "주간"} 보기
          </button>
        </div>

        {/* Profile summary card */}
        <div className="mt-3 rounded-2xl bg-white p-6 pt-7 pb-7 shadow-[0_2px_8px_rgba(0,0,0,0.06)] max-[380px]:p-5">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-semibold text-gray-900">{userName}</div>
              <div className="mt-1 text-xs text-gray-500">
                {period === "monthly" ? "이번 달" : "이번 주"} {points.toLocaleString()} 점
                {accuracyPct > 0 && <span className="ml-2 text-[#6E63D5]">· 정답률 {accuracyPct}%</span>}
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setLeaderboardMode("world")}
                className={leaderboardMode === "world" ? "" : "opacity-50"}
              >
                <StatPill label="WORLD" value="—" />
              </button>
              <button
                onClick={() => setLeaderboardMode("local")}
                className={leaderboardMode === "local" ? "" : "opacity-50"}
              >
                <StatPill label="LOCAL" value="—" />
              </button>
            </div>
          </div>

          {/* Progress */}
          <div className="mt-4 rounded-2xl bg-[#F3F1FF] p-4">
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold text-[#2B245A]">
                {period === "monthly" ? "이번 달" : "이번 주"} 진행률
              </div>
              <div className="text-xs text-gray-500">
                목표 {monthlyGoal}문항 / 현재 {playedThisMonth}문항
              </div>
            </div>

            <div className="mt-3 flex items-center gap-4">
              <ProgressRing value={progressPct} label={`${playedThisMonth}/${monthlyGoal}`} />
              <div className="flex-1">
                <div className="text-sm text-gray-700">
                  현재 <span className="font-semibold text-[#6E63D5]">{progressPct}%</span> 달성
                </div>
                <div className="mt-1 text-xs text-gray-500">
                  오늘 {Math.max(0, Math.ceil((monthlyGoal - playedThisMonth) / 7))}~{Math.max(1, Math.ceil((monthlyGoal - playedThisMonth) / 5))}문항씩 하면 목표 달성 가능
                </div>

                <div className="mt-3 h-2 w-full rounded-full bg-white">
                  <div
                    className="h-2 rounded-full bg-[#6E63D5]"
                    style={{ width: `${progressPct}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Advice */}
          <div className="mt-4">
            <div className="mb-2 text-sm font-semibold text-gray-900">추천 학습</div>
            <div className="grid gap-2">
              {advice.map((a) => (
                <div key={a.title} className="rounded-2xl border border-[#D9D5F6] bg-white p-3">
                  <div className="text-sm font-semibold text-[#6E63D5]">{a.title}</div>
                  <div className="mt-1 text-xs text-gray-600">{a.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Leaderboard */}
        <div className="mt-4 rounded-2xl bg-white p-6 pt-7 pb-7 shadow-[0_2px_8px_rgba(0,0,0,0.06)] max-[380px]:p-5">
          <div className="flex items-center justify-between">
            <div className="text-sm font-semibold text-gray-900">리더보드</div>
            <div className="text-xs text-gray-500">{period === "monthly" ? "월간" : "주간"}</div>
          </div>

          <div className="mt-3 grid gap-2">
            {leaderboard.map((r) => (
              <div
                key={`${r.rank}-${r.name}`}
                className={`flex items-center justify-between rounded-2xl border p-3 ${
                  r.name === userName
                    ? "border-[#D9D5F6] bg-[#F3F1FF]"
                    : "border-gray-100 bg-white"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gray-100 text-xs font-semibold text-gray-700">
                    {r.rank}
                  </div>
                  <div className="text-sm font-semibold text-gray-900">{r.name}</div>
                  {r.badge && <BadgeDot type={r.badge} />}
                </div>

                <div className="text-sm font-semibold text-[#6E63D5]">{r.points.toLocaleString()}P</div>
              </div>
            ))}
          </div>

          <button
            type="button"
            className="mt-3 w-full rounded-full bg-[#6E63D5] py-3 text-sm font-semibold text-white hover:bg-[#584FAA] active:bg-[#4D4595] max-[380px]:py-2.5 max-[380px]:text-xs"
          >
            내 약점 분석 보기
          </button>
        </div>
      </div>
    </div>
  );
}

function StatPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-full bg-[#6E63D5] px-3 py-2 text-center max-[380px]:px-2.5 max-[380px]:py-1.5">
      <div className="text-[10px] font-medium text-white/80">{label}</div>
      <div className="text-xs font-semibold text-white">{value}</div>
    </div>
  );
}

function BadgeDot({ type }: { type: "gold" | "silver" | "bronze" }) {
  const cls =
    type === "gold"
      ? "bg-amber-400"
      : type === "silver"
      ? "bg-gray-300"
      : "bg-orange-400";

  return <span className={`inline-block h-2 w-2 rounded-full ${cls}`} />;
}

function ProgressRing({ value, label }: { value: number; label: string }) {
  // SVG ring
  const size = 92;
  const stroke = 10;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (value / 100) * c;

  return (
    <div className="relative grid place-items-center">
      <svg width={size} height={size} className="block">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          strokeWidth={stroke}
          className="fill-none stroke-white"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          strokeWidth={stroke}
          strokeDasharray={c}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="fill-none stroke-[#6E63D5]"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>
      <div className="absolute text-center">
        <div className="text-lg font-extrabold text-[#6E63D5]">{value}%</div>
        <div className="text-[11px] text-gray-500">{label}</div>
      </div>
    </div>
  );
}
