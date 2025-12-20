"use client";

import { useRouter } from "next/navigation";
import { mockGameSet } from "@/lib/quiz/mockGameSet";

export default function PlayHomePage() {
  const router = useRouter();

  const handleStart = () => {
    // 세션 시작: 게임 세트를 session storage에 저장하고 세션 페이지로 이동
    if (typeof window !== "undefined") {
      sessionStorage.setItem("currentGameSet", JSON.stringify(mockGameSet));
      sessionStorage.setItem("gameSessionStartTime", Date.now().toString());
    }
    router.push("/play/session");
  };

  return (
    <div className="min-h-[calc(100vh-64px)] bg-[#F6F5FF]">
      {/* 배경(Queezy 느낌) */}
      <div className="relative mx-auto max-w-[520px] px-4 pb-10 pt-6">
        <div className="absolute -top-10 -left-10 h-56 w-56 rounded-full bg-[#B9B4E4]/35 blur-2xl" />
        <div className="absolute top-24 -right-10 h-56 w-56 rounded-full bg-[#6E63D5]/25 blur-2xl" />

        {/* 카드 */}
        <div className="relative overflow-hidden rounded-[28px] bg-white/70 p-6 shadow-[0_18px_55px_rgba(110,99,213,0.20)] backdrop-blur">
          {/* 상단 헤더 */}
          <div className="mb-5 flex items-center justify-between">
            <button
              onClick={() => router.back()}
              className="rounded-full px-3 py-2 text-sm font-medium text-[#3A2F8C] hover:bg-[#F0EEFF]"
            >
              ← 뒤로가기
            </button>

            <div className="h-10 w-10 rounded-full bg-[#6E63D5]/15" />
          </div>

          <h1 className="text-center text-[26px] font-extrabold tracking-tight text-[#1F1B3A]">
            오늘의 5분 미션
          </h1>
          <p className="mt-2 text-center text-sm text-[#6B66A3]">
            매일 5분씩 즐기며 영어 실력을 키워보세요
          </p>

          {/* 정보칩 */}
          <div className="mt-6 grid grid-cols-2 gap-3">
            <div className="rounded-2xl bg-[#F6F5FF] px-4 py-3 text-center">
              <div className="text-xs text-[#6B66A3]">총 문제</div>
              <div className="mt-1 text-lg font-extrabold text-[#2A2457]">{mockGameSet.items.length}문제</div>
            </div>
            <div className="rounded-2xl bg-[#F6F5FF] px-4 py-3 text-center">
              <div className="text-xs text-[#6B66A3]">예상 소요 시간</div>
              <div className="mt-1 text-lg font-extrabold text-[#2A2457]">약 5분</div>
            </div>
          </div>

          {/* CTA */}
          <button
            onClick={handleStart}
            className="mt-6 w-full rounded-2xl bg-[#6E63D5] py-4 text-base font-extrabold text-white shadow-[0_14px_30px_rgba(110,99,213,0.35)] transition hover:brightness-105 active:scale-[0.99]"
          >
            시작하기
          </button>

          <p className="mt-4 text-center text-xs text-[#6B66A3]">
            퀴즈를 완료하면 결과와 보상을 확인할 수 있습니다
          </p>
        </div>
      </div>
    </div>
  );
}

