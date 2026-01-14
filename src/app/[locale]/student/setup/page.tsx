"use client";

import React, { useEffect, useMemo, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase-browser";
import { ScreenCard, ScreenTitle } from "@/components/ui/ScreenCard";

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
  goalCount: number;
  period: string;
  weakQtypes?: WeakQtype[];
  todayPlan?: TodayPlanItem[];
  leaderboardWorld?: LeaderboardRow[];
  leaderboardLocal?: LeaderboardRow[];
  myRank?: number;
};

export default function StudentReportPage() {
  const [period, setPeriod] = useState<"weekly" | "monthly">("weekly");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [leaderboardMode, setLeaderboardMode] = useState<"world" | "local">("world");

  const userName = reportData?.userName || "학생";
  const points = reportData?.points || 0;
  const goalCount = period === "weekly" ? 140 : 600;
  const playedThisMonth = reportData?.played || 0;
  const accuracyPct = reportData?.accuracyPct || 0;

  const progressPct = Math.min(100, Math.round((playedThisMonth / goalCount) * 100));

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

        console.log("[setup] user.id:", user.id);

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

  // 내가 TOP5 밖인지 체크
  const myRank = reportData?.myRank || 0;
  const isInTop5 = leaderboard.some((r) => r.name === userName);
  const shouldShowMyRank = myRank > 5 && !isInTop5;

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
      <div className="px-1 pt-3 pb-24">
        <div className="px-5 mb-6">
          <ScreenTitle>리포트 PICK</ScreenTitle>
        </div>
        <ScreenCard>
          <div className="text-center text-sm text-gray-500">데이터를 불러오는 중...</div>
        </ScreenCard>
      </div>
    );
  }

  // 에러 발생
  if (error) {
    return (
      <div className="px-1 pt-3 pb-24">
        <div className="px-5 mb-6">
          <ScreenTitle>리포트 PICK</ScreenTitle>
        </div>
        <ScreenCard>
          <div className="text-center">
            <div className="text-sm text-red-600 mb-4">{error}</div>
            <button
              onClick={() => window.location.reload()}
              className="rounded-full bg-[#3b82f6] px-4 py-2 text-sm text-white hover:bg-[#2563eb]"
            >
              다시 시도
            </button>
          </div>
        </ScreenCard>
      </div>
    );
  }

  return (
    <div className="px-1 pt-3 pb-24">
      <div className="px-5 mb-6">
        <ScreenTitle>리포트 PICK</ScreenTitle>
      </div>

      <ScreenCard>
        {/* 주간/월간 전환 버튼 */}
        <div className="flex items-center justify-end mb-4">
          <button
            type="button"
            className="rounded-full border border-[#93c5fd] bg-white/70 px-3 py-1.5 text-xs text-[#1e3a8a]/80"
            onClick={() => setPeriod((p) => (p === "monthly" ? "weekly" : "monthly"))}
          >
            {period === "weekly" ? "월간" : "주간"} 보기
          </button>
        </div>

          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-semibold text-gray-900">{userName}</div>
              <div className="mt-1 text-xs text-gray-500">
                {period === "monthly" ? "이번 달" : "이번 주"} {points.toLocaleString()} 점
                {accuracyPct > 0 && <span className="ml-2 text-[#3b82f6]">· 정답률 {accuracyPct}%</span>}
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
          <div className="mt-4 rounded-2xl bg-[#dbeafe] p-4">
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold text-[#1e3a8a]">
                {period === "monthly" ? "이번 달" : "이번 주"} 진행률
              </div>
              <div className="text-xs text-gray-500">
                목표 {goalCount}문항 / 현재 {playedThisMonth}문항
              </div>
            </div>

            <div className="mt-3 flex items-center gap-4">
              <ProgressRing value={progressPct} label={`${playedThisMonth}/${goalCount}`} />
              <div className="flex-1">
                <div className="text-sm text-gray-700">
                  현재 <span className="font-semibold text-[#3b82f6]">{progressPct}%</span> 달성
                </div>
                <div className="mt-1 text-xs text-gray-500">
                  오늘 {Math.max(0, Math.ceil((goalCount - playedThisMonth) / 7))}~{Math.max(1, Math.ceil((goalCount - playedThisMonth) / 5))}문항씩 하면 목표 달성 가능
                </div>

                <div className="mt-3 h-2 w-full rounded-full bg-white">
                  <div
                    className="h-2 rounded-full bg-[#3b82f6]"
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
                <div key={a.title} className="rounded-2xl border border-[#93c5fd] bg-white p-3">
                  <div className="text-sm font-semibold text-[#3b82f6]">{a.title}</div>
                  <div className="mt-1 text-xs text-gray-600">{a.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </ScreenCard>

        {/* Leaderboard */}
        <ScreenCard className="mt-4">
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
                    ? "border-[#93c5fd] bg-[#dbeafe]"
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

                <div className="text-sm font-semibold text-[#3b82f6]">{r.points.toLocaleString()}P</div>
              </div>
            ))}

            {/* 내가 TOP5 밖이면 별도 행으로 표시 */}
            {shouldShowMyRank && (
              <>
                <div className="py-2 text-center">
                  <div className="inline-block text-xs text-gray-400">...</div>
                </div>
                <div className="flex items-center justify-between rounded-2xl border border-[#3b82f6] bg-[#dbeafe] p-3 ring-2 ring-[#3b82f6]/20">
                  <div className="flex items-center gap-3">
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#3b82f6] text-xs font-semibold text-white">
                      {myRank}
                    </div>
                    <div className="text-sm font-semibold text-[#3b82f6]">{userName} (나)</div>
                  </div>
                  <div className="text-sm font-semibold text-[#3b82f6]">{points.toLocaleString()}P</div>
                </div>
              </>
            )}
          </div>

          {/* 약점 분석 버튼: 10문제 이상 풀면 활성화 */}
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              disabled={playedThisMonth < 10}
              onClick={() => {
                if (playedThisMonth >= 10) {
                  window.location.href = "/ko/student/weakness";
                }
              }}
              className="group relative overflow-hidden flex-1 h-12 max-[380px]:h-10 rounded-[20px] text-sm max-[380px]:text-xs font-semibold transition-all duration-500 ease-out select-none active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-50 disabled:active:scale-100"
              style={
                playedThisMonth < 10
                  ? {
                      background: "linear-gradient(145deg, #e5e7eb 0%, #d1d5db 50%, #9ca3af 100%)",
                      boxShadow: "0 6px 20px -4px rgba(156,163,175,0.2)",
                      color: "#6b7280",
                    }
                  : {
                      background: "linear-gradient(145deg, #1e40af 0%, #1e3a8a 50%, #172554 100%)",
                      boxShadow: "0 10px 32px -4px rgba(30,64,175,0.5), 0 0 0 1px rgba(255,255,255,0.1) inset",
                      color: "white",
                    }
              }
            >
              {playedThisMonth >= 10 && (
                <>
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-400/0 to-blue-600/0 group-hover:from-blue-400/20 group-hover:to-blue-600/10 transition-all duration-500 pointer-events-none" />
                  <div
                    className="absolute top-0 left-0 right-0 h-[45%] opacity-40 group-hover:opacity-60 transition-opacity duration-500 pointer-events-none rounded-t-[20px]"
                    style={{ background: "linear-gradient(to bottom, rgba(255,255,255,0.25), transparent)" }}
                  />
                  <div
                    className="absolute -inset-[1px] rounded-[20px] opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                    style={{
                      background: "linear-gradient(145deg, rgba(96,165,250,0.6), rgba(59,130,246,0.4))",
                      filter: "blur(3px)",
                    }}
                  />
                  <div
                    className="absolute inset-0 opacity-[0.12] pointer-events-none"
                    style={{
                      background: `
                        radial-gradient(circle at 15% 30%, rgba(255,255,255,0.6) 0, transparent 2px),
                        radial-gradient(circle at 85% 25%, rgba(255,255,255,0.5) 0, transparent 1.5px),
                        radial-gradient(circle at 70% 70%, rgba(255,255,255,0.55) 0, transparent 2px)
                      `,
                    }}
                  />
                </>
              )}
              <span className="relative z-10 drop-shadow-[0_2px_8px_rgba(0,0,0,0.3)]">
                내 약점 분석 보기
              </span>
            </button>

            {/* 카톡으로 보내기 버튼 */}
            <button
              type="button"
              disabled={playedThisMonth < 10}
              onClick={() => {
                if (playedThisMonth >= 10) {
                  // 카카오톡 공유 로직 추가 예정
                  alert("카카오톡 공유 기능은 준비 중입니다.");
                }
              }}
              className="group relative overflow-hidden flex-1 h-12 max-[380px]:h-10 rounded-[20px] text-sm max-[380px]:text-xs font-semibold transition-all duration-500 ease-out select-none active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-50 disabled:active:scale-100"
              style={
                playedThisMonth < 10
                  ? {
                      background: "linear-gradient(145deg, #e5e7eb 0%, #d1d5db 50%, #9ca3af 100%)",
                      boxShadow: "0 6px 20px -4px rgba(156,163,175,0.2)",
                      color: "#6b7280",
                    }
                  : {
                      background: "linear-gradient(145deg, #FEE500 0%, #FAD100 50%, #F7C600 100%)",
                      boxShadow: "0 10px 32px -4px rgba(254,229,0,0.5), 0 0 0 1px rgba(255,255,255,0.2) inset",
                      color: "#3c1e1e",
                    }
              }
            >
              {playedThisMonth >= 10 && (
                <>
                  <div className="absolute inset-0 bg-gradient-to-br from-yellow-300/0 to-yellow-600/0 group-hover:from-yellow-300/20 group-hover:to-yellow-600/10 transition-all duration-500 pointer-events-none" />
                  <div
                    className="absolute top-0 left-0 right-0 h-[45%] opacity-50 group-hover:opacity-70 transition-opacity duration-500 pointer-events-none rounded-t-[20px]"
                    style={{ background: "linear-gradient(to bottom, rgba(255,255,255,0.4), transparent)" }}
                  />
                  <div
                    className="absolute -inset-[1px] rounded-[20px] opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                    style={{
                      background: "linear-gradient(145deg, rgba(254,229,0,0.6), rgba(247,198,0,0.4))",
                      filter: "blur(3px)",
                    }}
                  />
                  <div
                    className="absolute inset-0 opacity-[0.1] pointer-events-none"
                    style={{
                      background: `
                        radial-gradient(circle at 15% 30%, rgba(255,255,255,0.7) 0, transparent 2px),
                        radial-gradient(circle at 85% 25%, rgba(255,255,255,0.6) 0, transparent 1.5px),
                        radial-gradient(circle at 70% 70%, rgba(255,255,255,0.65) 0, transparent 2px)
                      `,
                    }}
                  />
                </>
              )}
              <span className="relative z-10 drop-shadow-[0_2px_6px_rgba(0,0,0,0.2)]">
                카톡으로 보내기
              </span>
            </button>
          </div>

          {/* 10문제 미만일 때 안내문 */}
          {playedThisMonth < 10 && (
            <div className="mt-2 text-center text-xs text-gray-500">
              약점 분석을 보려면 최소 10문제를 풀어야 합니다. (현재 {playedThisMonth}문제)
            </div>
          )}
        </ScreenCard>
    </div>
  );
}

function StatPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-full bg-[#3b82f6] px-3 py-2 text-center max-[380px]:px-2.5 max-[380px]:py-1.5">
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
          className="fill-none stroke-[#3b82f6]"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>
      <div className="absolute text-center">
        <div className="text-lg font-extrabold text-[#3b82f6]">{value}%</div>
        <div className="text-[11px] text-gray-500">{label}</div>
      </div>
    </div>
  );
}
