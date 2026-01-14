import Link from "next/link";
import HomeWithIntro from "@/components/HomeWithIntro";
import { GraduationCap, UserRound } from "lucide-react";

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

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

                {/* 정사각형 버튼 2개 - 프리미엄 글래스모피즘 스타일 */}
                <div className="mt-8 grid grid-cols-2 gap-3">
                  {/* 학생 - 딥 블루 글래스 */}
                  <Link
                    href={`/${locale}/student/mode`}
                    className="group relative overflow-hidden aspect-square rounded-[24px] w-full flex flex-col items-center justify-center gap-3 text-white no-underline transition-all duration-500 ease-out select-none active:scale-[0.97]"
                    style={{
                      background: "linear-gradient(145deg, #1e40af 0%, #1e3a8a 50%, #172554 100%)",
                      boxShadow: "0 8px 32px -4px rgba(30,64,175,0.5), 0 0 0 1px rgba(255,255,255,0.1) inset",
                    }}
                  >
                    {/* 호버 시 밝아지는 오버레이 */}
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-400/0 to-blue-600/0 group-hover:from-blue-400/20 group-hover:to-blue-600/10 transition-all duration-500 pointer-events-none" />

                    {/* 상단 글로우 효과 */}
                    <div
                      className="absolute top-0 left-0 right-0 h-[45%] opacity-40 group-hover:opacity-60 transition-opacity duration-500 pointer-events-none"
                      style={{
                        background: "linear-gradient(to bottom, rgba(255,255,255,0.25), transparent)",
                      }}
                    />

                    {/* 호버 시 외곽 글로우 */}
                    <div className="absolute -inset-[1px] rounded-[24px] opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                      style={{
                        background: "linear-gradient(145deg, rgba(96,165,250,0.5), rgba(59,130,246,0.3))",
                        filter: "blur(2px)",
                      }}
                    />

                    <div className="relative z-10 transition-all duration-500 group-hover:scale-110 group-hover:-translate-y-1 filter drop-shadow-[0_4px_8px_rgba(0,0,0,0.3)]">
                      <GraduationCap size={50} strokeWidth={2} className="text-white" />
                    </div>

                    <span className="relative z-10 text-[1.4rem] font-bold tracking-tight drop-shadow-[0_2px_8px_rgba(0,0,0,0.4)] group-hover:drop-shadow-[0_4px_12px_rgba(0,0,0,0.5)] transition-all duration-500">
                      학생
                    </span>
                  </Link>

                  {/* 선생님 - 플래티넘 글래스 */}
                  <Link
                    href={`/${locale}/teacher`}
                    className="group relative overflow-hidden aspect-square rounded-[24px] w-full flex flex-col items-center justify-center gap-3 no-underline transition-all duration-500 ease-out select-none active:scale-[0.97]"
                    style={{
                      background: "linear-gradient(145deg, #f1f5f9 0%, #e2e8f0 50%, #cbd5e1 100%)",
                      boxShadow: "0 8px 32px -4px rgba(100,116,139,0.4), 0 0 0 1px rgba(255,255,255,0.8) inset",
                      color: "#1e293b",
                    }}
                  >
                    {/* 호버 시 밝아지는 오버레이 */}
                    <div className="absolute inset-0 bg-gradient-to-br from-white/0 to-blue-100/0 group-hover:from-white/40 group-hover:to-blue-100/20 transition-all duration-500 pointer-events-none" />

                    {/* 상단 글로우 효과 */}
                    <div
                      className="absolute top-0 left-0 right-0 h-[45%] opacity-60 group-hover:opacity-80 transition-opacity duration-500 pointer-events-none"
                      style={{
                        background: "linear-gradient(to bottom, rgba(255,255,255,0.6), transparent)",
                      }}
                    />

                    {/* 호버 시 외곽 글로우 */}
                    <div className="absolute -inset-[1px] rounded-[24px] opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                      style={{
                        background: "linear-gradient(145deg, rgba(148,163,184,0.6), rgba(203,213,225,0.4))",
                        filter: "blur(2px)",
                      }}
                    />

                    <div className="relative z-10 transition-all duration-500 group-hover:scale-110 group-hover:-translate-y-1 filter drop-shadow-[0_2px_6px_rgba(30,41,59,0.2)]">
                      <UserRound size={50} strokeWidth={2} className="text-[#1e293b]" />
                    </div>

                    <span className="relative z-10 text-[1.4rem] font-bold tracking-tight drop-shadow-[0_1px_4px_rgba(255,255,255,0.8)] group-hover:drop-shadow-[0_2px_8px_rgba(255,255,255,1)] transition-all duration-500">
                      선생님
                    </span>
                  </Link>
                </div>

                {/* 요금제 보기 - 프리미엄 글래스 스타일 */}
                <div className="mt-6">
                  <Link
                    href={`/${locale}/plans`}
                    className="group relative overflow-hidden h-[62px] rounded-[24px] w-full flex items-center justify-center gap-2 text-[1.15rem] font-semibold no-underline transition-all duration-500 ease-out select-none active:scale-[0.98]"
                    style={{
                      background: "linear-gradient(145deg, #ffffff 0%, #f8fafc 50%, #f1f5f9 100%)",
                      boxShadow: "0 6px 24px -4px rgba(100,116,139,0.3), 0 0 0 1px rgba(203,213,225,0.4) inset",
                      color: "#1e3a8a",
                    }}
                  >
                    {/* 호버 시 밝아지는 오버레이 */}
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-50/0 via-indigo-50/0 to-blue-50/0 group-hover:from-blue-50/60 group-hover:via-indigo-50/40 group-hover:to-blue-50/60 transition-all duration-500 pointer-events-none" />

                    {/* 상단 글로우 효과 */}
                    <div
                      className="absolute top-0 left-0 right-0 h-[50%] opacity-70 group-hover:opacity-90 transition-opacity duration-500 pointer-events-none"
                      style={{
                        background: "linear-gradient(to bottom, rgba(255,255,255,0.8), transparent)",
                      }}
                    />

                    {/* 호버 시 외곽 글로우 */}
                    <div className="absolute -inset-[2px] rounded-[24px] opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                      style={{
                        background: "linear-gradient(145deg, rgba(96,165,250,0.4), rgba(165,180,252,0.3))",
                        filter: "blur(3px)",
                      }}
                    />

                    <span className="relative z-10 drop-shadow-[0_1px_2px_rgba(255,255,255,0.9)] group-hover:drop-shadow-[0_2px_6px_rgba(30,58,138,0.3)] transition-all duration-500">
                      요금제 보기
                    </span>
                    <span className="relative z-10 text-2xl transition-all duration-500 group-hover:translate-x-1.5 group-hover:scale-110 drop-shadow-[0_1px_2px_rgba(255,255,255,0.9)]">
                      ›
                    </span>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </HomeWithIntro>
  );
}
