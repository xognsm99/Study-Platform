"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { supabaseBrowser } from "@/lib/supabase-browser";
import { getMyProfile } from "@/lib/profile";
import { parseQuizScope } from "@/lib/quiz/scope";

type Props = {
  seed?: string;
};

const TOTAL_QUESTIONS = 10;

export default function PlayClient({ seed }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  // 사용자 인증 확인
  useEffect(() => {
    async function checkAuth() {
      const supabase = supabaseBrowser();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUserId(user?.id ?? null);
    }
    checkAuth();
  }, []);

  // TODO: 개발 중 검증용 - 배포 전 제거
  console.log("[PLAY seed]", seed ?? "today");

  const handleStart = async () => {
    if (loading) return;
    setLoading(true);

    try {
      // 프로필에서 quiz_scope 읽기
      const profile = await getMyProfile(userId ?? undefined);
      const quizScope = profile?.quiz_scope || "u1";

      // quiz_scope 파싱 (시험범위 또는 콤마로 구분된 units)
      const units = parseQuizScope(quizScope);
      const unitsParam = units.join(",");

      const seedKey = seed ?? "today";

      const res = await fetch(
        `/api/play/game-set?units=${encodeURIComponent(
          unitsParam
        )}&n=${TOTAL_QUESTIONS}&seed=${encodeURIComponent(seedKey)}`,
        { cache: "no-store" }
      );

      if (!res.ok) {
        const errorData = await res
          .json()
          .catch(() => ({ error: "알 수 없는 오류" }));
        alert(errorData.error || "게임셋 생성 실패");
        return;
      }

      const gameSet = await res.json();

      // 세션 시작: 게임 세트를 session storage에 저장하고 세션 페이지로 이동
      if (typeof window !== "undefined") {
        sessionStorage.removeItem("currentGameSet");
        sessionStorage.removeItem("gameSessionStartTime");
        sessionStorage.setItem("currentGameSet", JSON.stringify(gameSet));
        sessionStorage.setItem(
          "gameSessionStartTime",
          Date.now().toString()
        );
      }

      router.push("/play/session");
    } catch (e: any) {
      alert("게임 시작 실패: " + (e?.message ?? "Unknown error"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-64px)] bg-sky-50">
      {/* 배경(블루 글로우) */}
      <div className="relative mx-auto max-w-[520px] px-4 pb-10 pt-5">
        <div className="absolute -top-10 -left-10 h-56 w-56 rounded-full bg-blue-200/40 blur-2xl" />
        <div className="absolute top-24 -right-10 h-56 w-56 rounded-full bg-blue-700/15 blur-2xl" />

        {/* 카드 */}
        <div className="relative overflow-hidden rounded-[28px] bg-white/65 p-5 border border-blue-200/60 shadow-[0_20px_70px_rgba(30,64,175,0.12)] backdrop-blur-md">
          {/* 상단 헤더 */}
          <div className="mb-3 flex items-center justify-between">
            <button
              onClick={() => router.back()}
              className="rounded-full px-3 py-2 text-sm font-semibold text-[#1e3a8a] hover:bg-blue-50"
            >
              ← 뒤로가기
            </button>
          </div>

          <h1 className="text-center text-[24px] font-semibold tracking-tight text-[#1e40af]">
            단어/숙어 훈련
          </h1>
          <p className="mt-2 text-center text-sm text-slate-500">
            선택한 단원의 단어들만 PICK
          </p>

          {/* 정보칩 */}
          <div className="mt-5 grid grid-cols-2 gap-2">
            <div className="rounded-2xl bg-white/70 border border-blue-200/60 px-4 py-3 text-center backdrop-blur">
              <div className="text-xs text-slate-500">총 문제</div>
              <div className="mt-1 text-lg font-semibold text-slate-900">
                {TOTAL_QUESTIONS}문제
              </div>
            </div>
            <div className="rounded-2xl bg-white/70 border border-blue-200/60 px-4 py-3 text-center backdrop-blur">
              <div className="text-xs text-slate-500">예상 소요 시간</div>
              <div className="mt-1 text-lg font-semibold text-slate-900">
                약 1분
              </div>
            </div>
          </div>

          {/* CTA - Apple Glassmorphism */}
          <button
            onClick={handleStart}
            disabled={loading}
            className="
              mt-6
              group relative w-full h-16
              rounded-[22px]
              font-extrabold text-xl tracking-wide
              text-white
              overflow-hidden
              border border-white/25
              backdrop-blur-xl
              shadow-[0_18px_55px_rgba(30,64,175,0.28)]
              transition-all duration-300
              active:scale-[0.98]
              disabled:opacity-60 disabled:cursor-not-allowed
            "
            style={{
              background:
                "linear-gradient(145deg, rgba(59,130,246,0.45) 0%, rgba(30,64,175,0.78) 55%, rgba(23,37,84,0.92) 100%)",
            }}
          >
            {/* 유리 하이라이트 */}
            <span
              className="pointer-events-none absolute inset-0 opacity-70"
              style={{
                background:
                  "linear-gradient(to bottom, rgba(255,255,255,0.35) 0%, rgba(255,255,255,0.08) 35%, rgba(255,255,255,0.02) 100%)",
              }}
            />

            {/* 호버 시 은은한 광택 */}
            <span className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <span
                className="absolute -inset-[1px] rounded-[22px]"
                style={{
                  background:
                    "linear-gradient(145deg, rgba(147,197,253,0.65), rgba(59,130,246,0.35), rgba(255,255,255,0.15))",
                  filter: "blur(6px)",
                }}
              />
            </span>

            {/* 미세 도트 */}
            <span
              className="pointer-events-none absolute inset-0 opacity-[0.14]"
              style={{
                background: `
                  radial-gradient(circle at 18% 28%, rgba(255,255,255,0.65) 0, transparent 2px),
                  radial-gradient(circle at 78% 22%, rgba(255,255,255,0.55) 0, transparent 1.6px),
                  radial-gradient(circle at 72% 72%, rgba(255,255,255,0.55) 0, transparent 2.2px)
                `,
              }}
            />

            <span className="relative z-10 drop-shadow-[0_3px_12px_rgba(0,0,0,0.28)]">
              {loading ? "불러오는 중..." : "START"}
            </span>
          </button>

          <p className="mt-4 text-center text-xs text-slate-500">
            완료 후 훈련 결과를 확인 할 수 있습니다
          </p>
        </div>
      </div>
    </div>
  );
}
