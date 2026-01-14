"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase-browser";
import { getMyProfile, type StudentProfile } from "@/lib/profile";

export default function StudentModePage() {
  const router = useRouter();
  const params = useParams<{ locale: string }>();
  const locale = params?.locale || "ko";

  const [schoolName, setSchoolName] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadSchoolName() {
      try {
        const supabase = supabaseBrowser();
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          setLoading(false);
          return;
        }

        // 프로필에서 학교명 가져오기
        const profile = await getMyProfile(user.id);
        if (profile?.school) {
          setSchoolName(profile.school);
        }
      } catch (e) {
        console.error("학교명 로드 실패:", e);
      } finally {
        setLoading(false);
      }
    }

    loadSchoolName();
  }, []);

  const handleTrainingMode = () => {
    router.push(`/${locale}/student`);
  };

  const handleRealMode = () => {
    router.push(`/${locale}/student/problems`);
  };

  const handleGoToSetup = () => {
    router.push(`/${locale}/student/setup`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-sky-50 dark:bg-sky-50 flex items-center justify-center">
        <div className="text-[#2563eb] font-semibold">로딩 중...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-sky-50 dark:bg-sky-50">
      <div className="min-h-screen">
        <div className="max-w-[520px] mx-auto p-4 pb-28">
        {/* 유리 카드 컨테이너 */}
        <div className="relative rounded-[34px] bg-white/70 backdrop-blur-xl border border-white/60 shadow-[0_8px_32px_rgba(0,0,0,0.08)] overflow-hidden p-6">
          {/* 오버레이 1: radial highlight (왼쪽 상단) */}
          <div className="absolute inset-0 bg-[radial-gradient(120%_80%_at_20%_10%,rgba(255,255,255,0.65),transparent_55%)] pointer-events-none" />

          {/* 오버레이 2: 상단 light sheen */}
          <div className="absolute -top-16 left-[-20%] h-48 w-[140%] rotate-[-6deg] bg-gradient-to-b from-white/35 to-transparent pointer-events-none" />

          {/* 내용 */}
          <div className="relative z-10">
            {/* 상단 학교명 */}
            <div className="mb-8 text-center">
              {schoolName ? (
                <h1 className="text-2xl font-bold text-[#2B245A] mb-2">{schoolName}</h1>
              ) : (
                <div>
                  <h1 className="text-xl font-semibold text-gray-600 mb-3">학교 설정이 필요합니다</h1>
                  <button
                    onClick={handleGoToSetup}
                    className="text-sm text-[#2563eb] underline hover:text-[#1e40af]"
                  >
                    설정하러 가기 →
                  </button>
                </div>
              )}
            </div>

            {/* 모드 선택 버튼 - 애플 스타일 글래스모피즘 */}
            <div className="flex flex-col gap-4">
              {/* 훈련 모드 - 딥 블루 글래스 */}
              <button
                onClick={handleTrainingMode}
                className="group relative overflow-hidden h-28 rounded-[26px] w-full flex items-center justify-start px-7 gap-5 text-white border-none cursor-pointer transition-all duration-500 ease-out select-none active:scale-[0.97]"
                style={{
                  background: "linear-gradient(145deg, #1e40af 0%, #1e3a8a 50%, #172554 100%)",
                  boxShadow: "0 10px 40px -6px rgba(30,64,175,0.5), 0 0 0 1px rgba(255,255,255,0.1) inset",
                }}
              >
                {/* 호버 시 밝아지는 오버레이 */}
                <div className="absolute inset-0 bg-gradient-to-br from-blue-400/0 to-blue-600/0 group-hover:from-blue-400/20 group-hover:to-blue-600/10 transition-all duration-500 pointer-events-none" />

                {/* 상단 글로우 효과 */}
                <div
                  className="absolute top-0 left-0 right-0 h-[45%] opacity-40 group-hover:opacity-60 transition-opacity duration-500 pointer-events-none rounded-t-[26px]"
                  style={{
                    background: "linear-gradient(to bottom, rgba(255,255,255,0.3), transparent)",
                  }}
                />

                {/* 호버 시 외곽 글로우 */}
                <div
                  className="absolute -inset-[2px] rounded-[26px] opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                  style={{
                    background: "linear-gradient(145deg, rgba(96,165,250,0.6), rgba(59,130,246,0.4))",
                    filter: "blur(4px)",
                  }}
                />

                {/* 미세한 반짝임 */}
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

                <div className="relative z-10 text-[3.5rem] transition-all duration-500 group-hover:scale-110 group-hover:rotate-6 filter drop-shadow-[0_4px_12px_rgba(0,0,0,0.3)]">
                  🎯
                </div>
                <div className="relative z-10 text-[1.45rem] font-bold tracking-tight drop-shadow-[0_2px_8px_rgba(0,0,0,0.4)] group-hover:drop-shadow-[0_4px_12px_rgba(0,0,0,0.5)] transition-all duration-500">
                  훈련 모드
                </div>
              </button>

              {/* 실전 모드 - 파이어 레드 글래스 */}
              <button
                onClick={handleRealMode}
                className="group relative overflow-hidden h-28 rounded-[26px] w-full flex items-center justify-start px-7 gap-5 text-white border-none cursor-pointer transition-all duration-500 ease-out select-none active:scale-[0.97]"
                style={{
                  background: "linear-gradient(145deg, #dc2626 0%, #b91c1c 50%, #991b1b 100%)",
                  boxShadow: "0 10px 40px -6px rgba(220,38,38,0.5), 0 0 0 1px rgba(255,255,255,0.1) inset",
                }}
              >
                {/* 호버 시 밝아지는 오버레이 */}
                <div className="absolute inset-0 bg-gradient-to-br from-red-400/0 to-red-600/0 group-hover:from-red-400/20 group-hover:to-red-600/10 transition-all duration-500 pointer-events-none" />

                {/* 상단 글로우 효과 */}
                <div
                  className="absolute top-0 left-0 right-0 h-[45%] opacity-40 group-hover:opacity-60 transition-opacity duration-500 pointer-events-none rounded-t-[26px]"
                  style={{
                    background: "linear-gradient(to bottom, rgba(255,255,255,0.3), transparent)",
                  }}
                />

                {/* 호버 시 외곽 글로우 */}
                <div
                  className="absolute -inset-[2px] rounded-[26px] opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                  style={{
                    background: "linear-gradient(145deg, rgba(248,113,113,0.6), rgba(239,68,68,0.4))",
                    filter: "blur(4px)",
                  }}
                />

                {/* 미세한 반짝임 */}
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

                <div className="relative z-10 text-[3.5rem] transition-all duration-500 group-hover:scale-110 group-hover:rotate-6 filter drop-shadow-[0_4px_12px_rgba(0,0,0,0.3)]">
                  🔥
                </div>
                <div className="relative z-10 text-[1.45rem] font-bold tracking-tight drop-shadow-[0_2px_8px_rgba(0,0,0,0.4)] group-hover:drop-shadow-[0_4px_12px_rgba(0,0,0,0.5)] transition-all duration-500">
                  실전 모드
                </div>
              </button>
            </div>
          </div>
        </div>

        </div>
      </div>
    </div>
  );
}
