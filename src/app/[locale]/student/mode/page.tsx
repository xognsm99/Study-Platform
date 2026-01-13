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

            {/* 모드 선택 버튼 - 세로 배치 */}
            <div className="flex flex-col gap-3">
              {/* 훈련 모드 - 학생 버튼 블루 그라데이션 */}
              <button
                onClick={handleTrainingMode}
                className="group relative overflow-hidden h-24 rounded-[20px] w-full flex items-center justify-start px-6 gap-4 text-white border-none cursor-pointer transition-all duration-300 ease-out select-none bg-gradient-to-br from-[#1e40af] via-[#2563eb] to-[#3b82f6] shadow-[0_6px_20px_rgba(30,64,175,0.35),0_3px_10px_rgba(37,99,235,0.25)] hover:shadow-[0_10px_30px_rgba(30,64,175,0.45),0_5px_15px_rgba(37,99,235,0.35)] hover:-translate-y-1 hover:scale-[1.01] active:scale-[0.98]"
              >
                {/* 별빛 반짝 오버레이 */}
                <div
                  className="absolute inset-0 opacity-[0.18] pointer-events-none"
                  style={{
                    backgroundImage: `
                      radial-gradient(circle at 20% 25%, rgba(255,255,255,0.8) 0, transparent 3px),
                      radial-gradient(circle at 75% 20%, rgba(255,255,255,0.6) 0, transparent 2.5px),
                      radial-gradient(circle at 85% 75%, rgba(255,255,255,0.7) 0, transparent 3px),
                      radial-gradient(circle at 30% 80%, rgba(255,255,255,0.5) 0, transparent 2px),
                      radial-gradient(circle at 60% 50%, rgba(255,255,255,0.45) 0, transparent 1.5px)
                    `,
                  }}
                />
                {/* 상단 하이라이트 */}
                <div className="absolute top-0 left-0 right-0 h-12 bg-gradient-to-b from-white/25 to-transparent pointer-events-none" />
                {/* 하단 그림자 */}
                <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-black/12 to-transparent pointer-events-none" />

                <div className="relative z-10 text-[3rem] drop-shadow-lg">🎯</div>
                <div className="relative z-10 text-xl font-bold tracking-tight drop-shadow-md">훈련 모드</div>
              </button>

              {/* 실전 모드 - 빨간색 그라데이션 */}
              <button
                onClick={handleRealMode}
                className="group relative overflow-hidden h-24 rounded-[20px] w-full flex items-center justify-start px-6 gap-4 text-white border-none cursor-pointer transition-all duration-300 ease-out select-none bg-gradient-to-br from-[#dc2626] via-[#ef4444] to-[#f87171] shadow-[0_6px_20px_rgba(220,38,38,0.35),0_3px_10px_rgba(239,68,68,0.25)] hover:shadow-[0_10px_30px_rgba(220,38,38,0.45),0_5px_15px_rgba(239,68,68,0.35)] hover:-translate-y-1 hover:scale-[1.01] active:scale-[0.98]"
              >
                {/* 별빛 반짝 오버레이 */}
                <div
                  className="absolute inset-0 opacity-[0.18] pointer-events-none"
                  style={{
                    backgroundImage: `
                      radial-gradient(circle at 20% 25%, rgba(255,255,255,0.8) 0, transparent 3px),
                      radial-gradient(circle at 75% 20%, rgba(255,255,255,0.6) 0, transparent 2.5px),
                      radial-gradient(circle at 85% 75%, rgba(255,255,255,0.7) 0, transparent 3px),
                      radial-gradient(circle at 30% 80%, rgba(255,255,255,0.5) 0, transparent 2px),
                      radial-gradient(circle at 60% 50%, rgba(255,255,255,0.45) 0, transparent 1.5px)
                    `,
                  }}
                />
                {/* 상단 하이라이트 */}
                <div className="absolute top-0 left-0 right-0 h-12 bg-gradient-to-b from-white/25 to-transparent pointer-events-none" />
                {/* 하단 그림자 */}
                <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-black/12 to-transparent pointer-events-none" />

                <div className="relative z-10 text-[3rem] drop-shadow-lg">🔥</div>
                <div className="relative z-10 text-xl font-bold tracking-tight drop-shadow-md">실전 모드</div>
              </button>
            </div>
          </div>
        </div>

        </div>
      </div>
    </div>
  );
}
