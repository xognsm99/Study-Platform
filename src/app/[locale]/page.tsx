"use client";

import Link from "next/link";
import HomeWithIntro from "@/components/HomeWithIntro";
import { GraduationCap, UserRound } from "lucide-react";

export default function HomePage({
  params,
}: {
  params: { locale: string };
}) {
  const { locale } = params;

  return (
    <HomeWithIntro locale={locale}>
      {/* 페이지 전체 배경 - 하늘색 */}
      <div className="relative min-h-screen bg-sky-50 dark:bg-sky-50">
        <div className="relative min-h-screen flex items-start justify-center px-4 pt-8 pb-24 max-[380px]:px-3 max-[380px]:pt-6">
          <div className="w-full max-w-md">
            {/* 두껍고 입체적인 유리 카드 */}
            <div
              className="relative rounded-[38px] bg-white/78 backdrop-blur-2xl border border-white/75 overflow-hidden p-8 sm:p-9"
              style={{
                boxShadow:
                  "0 30px 80px rgba(20,30,60,0.18), 0 10px 24px rgba(20,30,60,0.10), inset 0 1px 0 rgba(255,255,255,0.55)",
              }}
            >
              {/* 강화된 상단 빛 번짐 오버레이 */}
              <div className="absolute inset-0 bg-[radial-gradient(140%_90%_at_25%_8%,rgba(255,255,255,0.75),transparent_50%)] pointer-events-none" />

              {/* 상단 light sheen - 더 강하게 */}
              <div className="absolute -top-20 left-[-25%] h-56 w-[150%] rotate-[-8deg] bg-gradient-to-b from-white/45 to-transparent pointer-events-none" />

              {/* 내용 */}
              <div className="relative z-10">
                <h1
                  className="font-semibold tracking-tight text-2xl sm:text-2xl leading-snug mb-1"
                  style={{ color: "#24272D" }}
                >
                  <span className="block">PICK 하고,</span>
                  <span className="block">내신 점수 올리자</span>
                </h1>

                <p className="mt-3 text-sm" style={{ color: "#82808aff" }}>
                  학교 맞춤 문제 생성 어플
                </p>

                {/* 정사각형 버튼 2개 - 레퍼런스 스타일 */}
                <div className="mt-8 grid grid-cols-2 gap-4">
                  {/* 학생 버튼 - 고급스러운 블루 그라데이션 + 흰 아이콘 */}
                  <Link
                    href={`/${locale}/student/mode`}
                    className="group relative overflow-hidden aspect-square rounded-[20px] w-full flex flex-col items-center justify-center gap-3 text-white no-underline transition-all duration-200 ease-in-out select-none bg-gradient-to-br from-[#1e40af] via-[#2563eb] to-[#3b82f6] border-[2px] border-transparent shadow-[0_4px_16px_rgba(30,64,175,0.35),0_2px_8px_rgba(37,99,235,0.25)] hover:border-[#1e3a8a] hover:shadow-[0_8px_28px_rgba(30,64,175,0.45),0_4px_14px_rgba(37,99,235,0.35)] hover:-translate-y-0.5 active:scale-[0.98]"
                  >
                    {/* 별빛 반짝 오버레이 */}
                    <div
                      className="absolute inset-0 opacity-[0.20] pointer-events-none"
                      style={{
                        background: `
                          radial-gradient(circle at 25% 20%, rgba(255,255,255,0.8) 0, transparent 3px),
                          radial-gradient(circle at 70% 15%, rgba(255,255,255,0.6) 0, transparent 2.5px),
                          radial-gradient(circle at 80% 70%, rgba(255,255,255,0.7) 0, transparent 3px),
                          radial-gradient(circle at 35% 75%, rgba(255,255,255,0.5) 0, transparent 2px),
                          radial-gradient(circle at 60% 50%, rgba(255,255,255,0.45) 0, transparent 1.5px),
                          radial-gradient(circle at 15% 50%, rgba(255,255,255,0.4) 0, transparent 2px)
                        `,
                        backgroundSize: "100% 100%",
                      }}
                    />

                    {/* 하단 glow */}
                    <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-white/20 to-transparent pointer-events-none" />

                    {/* 아이콘 - 졸업모자 */}
                    <div className="relative z-10">
                      <GraduationCap size={48} strokeWidth={2.25} className="text-white" />
                    </div>

                    <span className="relative z-10 text-[1.35rem] font-bold tracking-tight">
                      학생
                    </span>
                  </Link>

                  {/* 선생 버튼 - 밝은 유리 + 어두운 파랑 아이콘 */}
                  <Link
                    href={`/${locale}/teacher`}
                    className="group relative overflow-hidden aspect-square rounded-[20px] w-full flex flex-col items-center justify-center gap-3 text-[#1E3A8A] no-underline transition-all duration-200 ease-in-out select-none bg-white/75 backdrop-blur-md border-[2px] border-slate-200 shadow-[0_4px_16px_rgba(30,58,138,0.14),0_3px_8px_rgba(30,58,138,0.10)] hover:bg-gradient-to-br hover:from-[#bfdbfe] hover:via-[#dbeafe] hover:to-[#eff6ff] hover:border-blue-300 hover:shadow-[0_8px_28px_rgba(30,64,175,0.3),0_4px_14px_rgba(37,99,235,0.2)] hover:-translate-y-0.5 active:scale-[0.98]"
                  >
                    {/* 내부 sheen */}
                    <div className="absolute inset-0 bg-gradient-to-br from-white/45 via-white/15 to-transparent pointer-events-none" />

                    {/* 아이콘 - 선생님 */}
                    <div className="relative z-10">
                      <UserRound size={48} strokeWidth={2.25} className="text-[#0B1F3A]" />
                    </div>

                    <span className="relative z-10 text-[1.35rem] font-bold tracking-tight">
                      선생님
                    </span>
                  </Link>
                </div>

                {/* 요금제 보기 버튼 - 화살표 포함 */}
                <div className="mt-6">
                  <Link
                    href={`/${locale}/plans`}
                    className="group relative overflow-hidden h-[58px] rounded-[22px] bg-white/60 backdrop-blur-md border-[2px] border-[#1E3A8A]/18 text-[#1E3A8A] w-full flex items-center justify-center gap-2 text-[1.15rem] font-semibold no-underline transition-all duration-300 ease-out select-none shadow-[0_4px_14px_rgba(30,58,138,0.12)] hover:bg-white/78 hover:border-[#1E3A8A]/28 hover:text-[#2563EB] hover:shadow-[0_7px_22px_rgba(30,58,138,0.20)] hover:-translate-y-0.5 active:scale-[0.98]"
                  >
                    {/* 내부 sheen */}
                    <div className="absolute top-0 left-0 right-0 h-10 bg-gradient-to-b from-white/40 to-transparent pointer-events-none" />

                    <span className="relative z-10">요금제 보기</span>
                    <span className="relative z-10 text-lg transition-transform duration-300 group-hover:translate-x-0.5">
                      ›
                    </span>
                  </Link>
                </div>

                {/* TODO: 나중에 프로필 기반 기능(결제/프리셋 저장/기관 관리) 추가 시
                    역할 선택 후 프로필 확인/생성 단계 추가 가능 */}
              </div>
            </div>
          </div>
        </div>
      </div>
    </HomeWithIntro>
  );
}
