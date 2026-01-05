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
      const { data: { user } } = await supabase.auth.getUser();
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
        `/api/play/game-set?units=${encodeURIComponent(unitsParam)}&n=${TOTAL_QUESTIONS}&seed=${encodeURIComponent(seedKey)}`,
        { cache: "no-store" }
      );

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: "알 수 없는 오류" }));
        alert(errorData.error || "게임셋 생성 실패");
        return;
      }

      const gameSet = await res.json();

      // 세션 시작: 게임 세트를 session storage에 저장하고 세션 페이지로 이동
      if (typeof window !== "undefined") {
        sessionStorage.removeItem("currentGameSet");
        sessionStorage.removeItem("gameSessionStartTime");
        sessionStorage.setItem("currentGameSet", JSON.stringify(gameSet));
        sessionStorage.setItem("gameSessionStartTime", Date.now().toString());
      }

      router.push("/play/session");
    } catch (e: any) {
      alert("게임 시작 실패: " + (e?.message ?? "Unknown error"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-64px)] bg-[#F6F5FF]">
      {/* 배경(Queezy 느낌) */}
      <div className="relative mx-auto max-w-[520px] px-4 pb-10 pt-5">
        <div className="absolute -top-10 -left-10 h-56 w-56 rounded-full bg-[#B9B4E4]/35 blur-2xl" />
        <div className="absolute top-24 -right-10 h-56 w-56 rounded-full bg-[#6E63D5]/25 blur-2xl" />

        {/* 카드 */}
        <div className="relative overflow-hidden rounded-[28px] bg-white/70 p-5 shadow-[0_18px_55px_rgba(110,99,213,0.20)] backdrop-blur">
          {/* 상단 헤더 */}
          <div className="mb-3 flex items-center justify-between">
            <button
              onClick={() => router.back()}
              className="rounded-full px-3 py-2 text-sm font-medium text-[#3A2F8C] hover:bg-[#F0EEFF]"
            >
              ← 뒤로가기
            </button>
          </div>

          <h1 className="text-center text-[24px] font-extrabold tracking-tight text-[#1F1B3A]">
            몸풀기 단어 퀴즈
          </h1>
          <p className="mt-2 text-center text-sm text-[#6B66A3]">
            문제 풀기전 단어 먼저 익히자
          </p>

          {/* 정보칩 */}
          <div className="mt-5 grid grid-cols-2 gap-1">
            <div className="rounded-2xl bg-[#F6F5FF] px-4 py-3 text-center">
              <div className="text-xs text-[#6B66A3]">총 문제</div>
              <div className="mt-1 text-lg font-extrabold text-[#2A2457]">
                {TOTAL_QUESTIONS}문제
              </div>
            </div>
            <div className="rounded-2xl bg-[#F6F5FF] px-4 py-3 text-center">
              <div className="text-xs text-[#6B66A3]">예상 소요 시간</div>
              <div className="mt-1 text-lg font-extrabold text-[#2A2457]">약 1분</div>
            </div>
          </div>

          {/* CTA */}
          <button
            onClick={handleStart}
            disabled={loading}
            className="mt-6 w-full rounded-2xl bg-[#6E63D5] py-4 text-xl font-extrabold text-white shadow-[0_14px_30px_rgba(110,99,213,0.35)] transition hover:brightness-105 active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? "불러오는 중..." : "START"}
          </button>

          <p className="mt-4 text-center text-xs text-[#6B66A3]">
            퀴즈를 완료하면 결과를 확인 할 수 있습니다
          </p>
        </div>
      </div>
    </div>
  );
}
