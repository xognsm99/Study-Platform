"use client";

import { useRouter } from "next/navigation";

export default function ReadingABPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-[#6E63D5] px-4 py-6">
      <div className="mx-auto w-full max-w-[420px]">
        <div className="mb-4 flex items-center justify-between text-white">
          <button onClick={() => router.back()} className="text-white/90">
            ← 뒤로가기
          </button>
          <div className="font-semibold">A/B 본문 선택 퀴즈</div>
          <div className="w-[60px]" />
        </div>

        <div className="rounded-[28px] bg-white/95 p-5 shadow-[0_24px_80px_rgba(22,16,60,0.35)]">
          <div className="text-slate-900 font-extrabold text-[18px]">
            준비중
          </div>
          <p className="mt-2 text-slate-600 text-sm">
            다음 단계에서 A/B 선택형 본문 퀴즈 로직을 붙일게요.
          </p>

          <button
            onClick={() => router.back()}
            className="mt-6 w-full rounded-full bg-[#B9B4E4] py-4 text-[#2B245A] font-semibold"
          >
            학생 페이지로 돌아가기
          </button>
        </div>
      </div>
    </div>
  );
}

