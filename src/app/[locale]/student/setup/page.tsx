"use client";

import React, { useMemo, useState } from "react";

type LeaderRow = {
  rank: number;
  name: string;
  points: number;
  badge?: "gold" | "silver" | "bronze";
};

export default function StudentReportPage() {
  // ✅ 나중에 Supabase user/profile에서 가져오면 됨
  const userName = "학생";
  const points = 590;
  const worldRank = 1438;
  const localRank = 56;

  // ✅ 목표 설정 (나중에 사용자 설정으로)
  const monthlyGoal = 50;
  const playedThisMonth = 37;

  const progressPct = Math.min(100, Math.round((playedThisMonth / monthlyGoal) * 100));

  const [period, setPeriod] = useState<"weekly" | "monthly">("monthly");

  const leaderboard: LeaderRow[] = useMemo(
    () => [
      { rank: 1, name: "Davis", points: 2569, badge: "gold" },
      { rank: 2, name: "Alena", points: 1469, badge: "silver" },
      { rank: 3, name: "Craig", points: 1053, badge: "bronze" },
      { rank: 4, name: userName, points: points },
      { rank: 5, name: "Zain", points: 448 },
    ],
    [userName, points]
  );

  const advice = useMemo(() => {
    // ✅ 나중에 카테고리별 정답률/오답률 기반으로 생성
    return [
      { title: "오늘 10문항", desc: "문법(빈칸) 10문항만 풀고 마무리하세요." },
      { title: "약점 보완", desc: "최근 오답이 많은 유형: 본문 일치 → 내일 15문항 추천" },
      { title: "루틴", desc: "3일 연속 학습을 만들면 점수가 안정적으로 오릅니다." },
    ];
  }, []);

  return (
    <div className="px-4 pt-4 pb-24 max-[380px]:px-3 max-[380px]:pt-3">
      <div className="mx-auto w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-semibold text-violet-800 max-[380px]:text-base">
            학습 리포트
          </h1>

          <button
            type="button"
            className="rounded-full border border-violet-200 bg-white/70 px-3 py-1.5 text-xs text-violet-700"
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
              <div className="mt-1 text-xs text-gray-500">지금까지 {points.toLocaleString()} 점</div>
            </div>

            <div className="flex gap-2">
              <StatPill label="WORLD" value={`#${worldRank.toLocaleString()}`} />
              <StatPill label="LOCAL" value={`#${localRank.toLocaleString()}`} />
            </div>
          </div>

          {/* Progress */}
          <div className="mt-4 rounded-2xl bg-violet-50 p-4">
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold text-violet-800">
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
                  현재 <span className="font-semibold text-violet-800">{progressPct}%</span> 달성
                </div>
                <div className="mt-1 text-xs text-gray-500">
                  오늘 {Math.max(0, Math.ceil((monthlyGoal - playedThisMonth) / 7))}~{Math.max(1, Math.ceil((monthlyGoal - playedThisMonth) / 5))}문항씩 하면 목표 달성 가능
                </div>

                <div className="mt-3 h-2 w-full rounded-full bg-white">
                  <div
                    className="h-2 rounded-full bg-violet-500"
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
                <div key={a.title} className="rounded-2xl border border-violet-100 bg-white p-3">
                  <div className="text-sm font-semibold text-violet-800">{a.title}</div>
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
                    ? "border-violet-200 bg-violet-50"
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

                <div className="text-sm font-semibold text-violet-800">{r.points.toLocaleString()}P</div>
              </div>
            ))}
          </div>

          <button
            type="button"
            className="mt-3 w-full rounded-full bg-violet-600 py-3 text-sm font-semibold text-white hover:bg-violet-700 max-[380px]:py-2.5 max-[380px]:text-xs"
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
    <div className="rounded-full bg-violet-600 px-3 py-2 text-center max-[380px]:px-2.5 max-[380px]:py-1.5">
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
          className="fill-none stroke-violet-500"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>
      <div className="absolute text-center">
        <div className="text-lg font-extrabold text-violet-800">{value}%</div>
        <div className="text-[11px] text-gray-500">{label}</div>
      </div>
    </div>
  );
}
