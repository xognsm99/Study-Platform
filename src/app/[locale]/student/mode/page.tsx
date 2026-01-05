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
      <div className="min-h-screen bg-[#F5F3FF] flex items-center justify-center">
        <div className="text-[#6E63D5] font-semibold">로딩 중...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-violet-100">
      <div className="max-w-[520px] mx-auto p-4">
        {/* 상단 학교명 */}
        <div className="mb-8 text-center">
          {schoolName ? (
            <h1 className="text-2xl font-bold text-[#2B245A] mb-2">{schoolName}</h1>
          ) : (
            <div>
              <h1 className="text-xl font-semibold text-gray-600 mb-3">학교 설정이 필요합니다</h1>
              <button
                onClick={handleGoToSetup}
                className="text-sm text-[#6E63D5] underline hover:text-[#5B4ED4]"
              >
                설정하러 가기 →
              </button>
            </div>
          )}
        </div>

        {/* 모드 선택 버튼 - 가로 2개 배치 */}
        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={handleTrainingMode}
            style={{
              aspectRatio: "1",
              borderRadius: "20px",
              background: "#d4ceffff",
              color: "#6A5AE0",
              width: "100%",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "1.25rem",
              fontWeight: 600,
              textDecoration: "none",
              transition: "all 0.2s ease-in-out",
              userSelect: "none",
              WebkitUserSelect: "none",
              border: "none",
              cursor: "pointer",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "#5B4ED4";
              e.currentTarget.style.transform = "translateY(-2px)";
              e.currentTarget.style.boxShadow = "0 8px 16px rgba(106, 90, 224, 0.3)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "#6A5AE0";
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "none";
            }}
            onMouseDown={(e) => {
              e.currentTarget.style.transform = "translateY(0) scale(0.98)";
            }}
            onMouseUp={(e) => {
              e.currentTarget.style.transform = "translateY(-2px) scale(1)";
            }}
          >
            <div style={{ fontSize: "2.5rem", marginBottom: "8px" }}>🎯</div>
            <div>훈련 모드</div>
          </button>

          <button
            onClick={handleRealMode}
            style={{
              aspectRatio: "1",
              borderRadius: "20px",
              background: "#877be4ff",
              color: "#fff",
              width: "100%",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "1.25rem",
              fontWeight: 600,
              textDecoration: "none",
              transition: "all 0.2s ease-in-out",
              userSelect: "none",
              WebkitUserSelect: "none",
              border: "none",
              cursor: "pointer",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "#5B4ED4";
              e.currentTarget.style.transform = "translateY(-2px)";
              e.currentTarget.style.boxShadow = "0 8px 16px rgba(106, 90, 224, 0.3)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "#6A5AE0";
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "none";
            }}
            onMouseDown={(e) => {
              e.currentTarget.style.transform = "translateY(0) scale(0.98)";
            }}
            onMouseUp={(e) => {
              e.currentTarget.style.transform = "translateY(-2px) scale(1)";
            }}
          >
            <div style={{ fontSize: "2.5rem", marginBottom: "8px" }}>🔥</div>
            <div>실전 모드</div>
          </button>
        </div>

       
      </div>
    </div>
  );
}
