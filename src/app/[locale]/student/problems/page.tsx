"use client";

import { useMemo, useState, useEffect, Suspense } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import QuizClient from "@/components/QuizClient";
import { getMyProfile, isProfileComplete, type StudentProfile } from "@/lib/profile";
import { supabaseBrowser } from "@/lib/supabase-browser";
import StudentHomeShell from "@/components/queezy/StudentHomeShell";
import { ScreenCard, ScreenTitle } from "@/components/ui/ScreenCard";


const GROUPS = [
  { key: "vocab", label: "어휘" },
  { key: "grammar", label: "문법" },
  { key: "reading", label: "본문" },
  { key: "dialogue", label: "대화문" },
] as const;

// 단원 옵션 (value와 label 분리)
const UNIT_OPTIONS: Array<{ value: string; label: string }> = [
  { value: "u1", label: "1단원" },
  { value: "u2", label: "2단원" },
  { value: "u3", label: "3단원" },
  { value: "u4", label: "4단원" },
  { value: "u5", label: "5단원" },
  { value: "u6", label: "6단원" },
  { value: "u7", label: "7단원" },
  { value: "u8", label: "8단원" },
  { value: "u9", label: "9단원" },
  { value: "u10", label: "10단원" },
  { value: "u11", label: "11단원" },
  { value: "u12", label: "12단원" },
  { value: "mid1", label: "1학기 중간고사" },
  { value: "final1", label: "1학기 기말고사" },
  { value: "mid2", label: "2학기 중간고사" },
  { value: "final2", label: "2학기 기말고사" },
  { value: "overall", label: "종합평가" },
];

function StudentProblemsPageContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  // locale 추출 (예: `/ko/student` -> ko)
  const locale = pathname?.split(`/`)[1] || "ko";

  // 인증 관련 state
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);

  // 프로필 관련 state
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);

  // grade 값은 항상 DB용 코드값("1","2","3")으로 유지
  const [grade, setGrade] = useState<string>("2");
  const [unitRange, setUnitRange] = useState<string>(UNIT_OPTIONS[0].value);
  const [selectedGroups, setSelectedGroups] = useState<Set<string>>(
    new Set([])
  );
  const [started, setStarted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [problems, setProblems] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  // 인증 상태 확인 및 구독
  useEffect(() => {
    const supabase = supabaseBrowser();

    // 초기 세션 확인
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null);
      setAuthReady(true);
    });

    // 인증 상태 변경 구독
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setAuthReady(true);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // authReady가 true이고 user가 null일 때만 리다이렉트
  useEffect(() => {
    if (!authReady) return;
    if (!user) {
      router.replace(`/auth?next=${encodeURIComponent(`/${locale}/student/problems`)}`);
    }
  }, [authReady, user, locale, router]);

  // 프로필 로드 (user가 준비된 후)
  useEffect(() => {
    if (!authReady) return;

    async function loadProfile() {
      try {
        const data = await getMyProfile(user?.id);
        setProfile(data);
        
        // 프로필이 완성되었으면 프로필 정보로 state 초기화
        if (isProfileComplete(data) && data) {
          setGrade(data.grade || "2");
          setUnitRange(data.term || UNIT_OPTIONS[0].value);
        }
      } catch (e) {
        console.error("[StudentProblemsPage] 프로필 로드 실패:", e);
      } finally {
        setProfileLoading(false);
      }
    }
    loadProfile();
  }, [authReady, user?.id]);

  // ✅ replay=1 쿼리 처리: 저장된 문제 세트 복원
  useEffect(() => {
    const isReplay = searchParams?.get("replay") === "1";
    if (!isReplay || !authReady || profileLoading) return;

    try {
      // 1순위: sessionStorage의 lastQuizSet
      let restoredProblems: any[] | null = null;
      const lastQuizSet = sessionStorage.getItem("lastQuizSet");
      if (lastQuizSet) {
        try {
          restoredProblems = JSON.parse(lastQuizSet);
        } catch (e) {
          console.error("Failed to parse lastQuizSet from sessionStorage", e);
        }
      }

      // 2순위: localStorage의 lastQuizQuestions (lastQuizSet이 없을 때)
      if (!restoredProblems || restoredProblems.length === 0) {
        const lastQuizQuestions = localStorage.getItem("lastQuizQuestions");
        if (lastQuizQuestions) {
          try {
            restoredProblems = JSON.parse(lastQuizQuestions);
          } catch (e) {
            console.error("Failed to parse lastQuizQuestions from localStorage", e);
          }
        }
      }

      // 문제 세트 복원 성공 시 퀴즈 시작 상태로 진입
      if (restoredProblems && restoredProblems.length > 0) {
        setProblems(restoredProblems);
        setStarted(true);
        
        // URL에서 replay=1 제거 (replace로 새로고침 방지)
        const newSearchParams = new URLSearchParams(searchParams.toString());
        newSearchParams.delete("replay");
        const newSearch = newSearchParams.toString();
        const newUrl = newSearch ? `${pathname}?${newSearch}` : pathname;
        router.replace(newUrl);
      }
    } catch (e) {
      console.error("[StudentProblemsPage] replay 문제 세트 복원 실패:", e);
    }
  }, [searchParams, authReady, profileLoading, pathname, router]);

  const canProceed = useMemo(() => grade === "2" && selectedGroups.size > 0, [grade, selectedGroups]);

  const handleGroupToggle = (groupKey: string) => {
    const newSet = new Set(selectedGroups);
    if (newSet.has(groupKey)) {
      newSet.delete(groupKey);
    } else {
      newSet.add(groupKey);
    }
    setSelectedGroups(newSet);
  };

  const handleStart = async () => {
    if (!canProceed || loading) return;

    setLoading(true);
    setError(null);

    try {
      // DB로 전송하는 grade 값은 항상 코드값("2" 등)
      const gradeDbValue = grade || "2";

      // 선택된 그룹을 카테고리 값으로 변환 (vocab/grammar/reading/dialogue)
      const categories = Array.from(selectedGroups);

      if (process.env.NODE_ENV === "development") {
        console.log("[student/problems] START categories", categories, "count", categories.length);
      }

      // ✅ /api/student/random에는 쿼리스트링으로 grade/subject/categories를 CSV 형태로 전달
      const sp = new URLSearchParams();
      sp.set("grade", gradeDbValue);
      sp.set("subject", "english");
      sp.set("categories", categories.join(","));
      sp.set("count", "20");
      sp.set("unit", encodeURIComponent(unitRange));

      const res = await fetch(`/api/student/random?${sp.toString()}`, {
        method: "GET",
        cache: "no-store",
      });

      const data = await res.json();

      // API에서 에러가 반환된 경우 (0개로 처리하지 않고 에러로 처리)
      if (!data?.ok) {
        if (process.env.NODE_ENV === "development") {
          console.error("❌ 문제 로드 API 에러:", data);
          console.error("❌ 에러 메시지:", data?.error || data?.errorMessage);
          if (data?.errorDetails) {
            console.error("❌ 에러 상세:", data.errorDetails);
          }
        }
        
        // RLS 에러 또는 권한 문제인 경우 특별 처리
        if (data?.error?.includes("권한 문제") || data?.error?.includes("RLS")) {
          throw new Error(
            data.error || 
            "권한 문제(RLS) 또는 환경변수 Supabase 프로젝트 불일치. 관리자에게 문의하세요."
          );
        }
        
        // errorMessage가 있으면 우선 사용, 없으면 error 사용
        const errorMsg = data?.errorMessage || data?.error || "문제 로드 실패";
        throw new Error(errorMsg);
      }

      // problems가 없거나 빈 배열인 경우
      if (!data.problems || data.problems.length === 0) {
        // 에러 상세 정보가 있으면 로그로만 출력
        if (process.env.NODE_ENV === "development" && data?.errorDetails) {
          console.error("문제 로드 실패 상세:", data.errorDetails);
        }
        // 디버그 URL에 실제 선택된 카테고리 반영 (단일 선택 시)
        const debugCategory = categories.length === 1 ? categories[0] : "vocab";

        let errorMsg = "문제를 불러올 수 없습니다.";

        // errorMessage가 있으면 우선 사용
        if (data?.errorMessage) {
          errorMsg = data.errorMessage;
        }

        // 개발 환경에서만 errorDetails도 표시
        if (process.env.NODE_ENV === "development" && data?.errorDetails) {
          const details = JSON.stringify(data.errorDetails, null, 2);
          errorMsg += `\n\n[개발 모드 상세]\n${details}`;
        }

        // 디버그 링크 추가
        errorMsg += `\n\n디버그: /api/debug/problems?grade=2&subject=english&category=${debugCategory}`;

        throw new Error(errorMsg);
      }

      setProblems(data.problems);
      setStarted(true);
    } catch (err: any) {
      setError(err.message ?? "문제를 불러오는 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  // ✅ 로딩 중일 때 전체 화면 오버레이 표시
  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-sky-100/80 backdrop-blur-sm">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-sky-200 border-t-sky-600"></div>
        </div>
      </div>
    );
  }

  if (started && problems.length > 0) {
    const categoryForView =
      selectedGroups.size === 1 ? Array.from(selectedGroups)[0] : "vocab";
    const categoriesArray = Array.from(selectedGroups);

    return (
      <div className="mx-auto max-w-4xl p-6">
        <QuizClient
          grade={String(grade ?? "")}
          subject="english"
          category={String(categoryForView)}
          categories={categoriesArray}
          initialProblems={problems}
          requestedTotal={20}
        />
      </div>
    );
  }

  if (profileLoading || !authReady) {
    return (
      <StudentHomeShell>
        <div className="rounded-[28px] bg-transparent shadow-sm">
          <div className="p-5 pb-6 max-[380px]:p-4 max-[380px]:pb-5">
            {/* 로딩 중: 텍스트 없이 빈 스켈레톤 */}
          </div>
        </div>
      </StudentHomeShell>
    );
  }

  if (!profile || !isProfileComplete(profile)) {
    return (
      <StudentHomeShell>
        <div className="rounded-[28px] bg-white shadow-sm">
          <div className="p-5 pb-6 max-[380px]:p-4 max-[380px]:pb-5">
            <div className="text-center py-8 text-gray-500">
              프로필을 먼저 설정해주세요.
            </div>
          </div>
        </div>
      </StudentHomeShell>
    );
  }

  return (
    <StudentHomeShell>
      <div className="px-1 pt-3 pb-24">
        <div className="px-5 mb-6">
          <ScreenTitle>문제 PICK</ScreenTitle>
        </div>

        <ScreenCard>
            {/* 문제 유형 선택 */}
            <div>
              <div>
                <div className="text-lg font-semibold text-[#2A2457] mb-6">
                  문제 유형 선택
                </div>
                <div className="grid grid-cols-2 gap-4 max-[380px]:gap-3">
                  {GROUPS.map((group) => {
                    const isSelected = selectedGroups.has(group.key);
                    return (
                      <button
                        key={group.key}
                        type="button"
                        onClick={() => handleGroupToggle(group.key)}
                        aria-pressed={isSelected}
                        className={`w-full rounded-2xl border px-6 py-8 max-[380px]:px-4 max-[380px]:py-6 transition-all active:scale-[0.99] ${
                          isSelected
                            ? "border-[#60a5fa] bg-[#dbeafe] text-[#1e40af] shadow-[0_8px_20px_rgba(96,165,250,0.3)]"
                            : "border-[#e5e7eb] bg-white text-slate-700 hover:border-[#93c5fd] hover:bg-[#eff6ff]"
                        }`}
                      >
                        <span className="text-2xl max-[380px]:text-lg font-semibold">{group.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* 20문항 풀기 시작 버튼 - 애플 글래스모피즘 스타일 */}
            <div className="mt-8 max-[380px]:mt-6">
              <button
                onClick={handleStart}
                disabled={!canProceed || loading}
                className="group relative overflow-hidden w-full h-32 max-[380px]:h-24 rounded-[20px] text-3xl max-[380px]:text-2xl font-semibold transition-all duration-500 ease-out select-none active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-50 disabled:active:scale-100"
                style={
                  !canProceed || loading
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
                {!loading && !(!canProceed) && (
                  <>
                    {/* 호버 시 밝아지는 오버레이 */}
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-400/0 to-blue-600/0 group-hover:from-blue-400/20 group-hover:to-blue-600/10 transition-all duration-500 pointer-events-none" />

                    {/* 상단 글로우 */}
                    <div
                      className="absolute top-0 left-0 right-0 h-[45%] opacity-40 group-hover:opacity-60 transition-opacity duration-500 pointer-events-none rounded-t-[20px]"
                      style={{ background: "linear-gradient(to bottom, rgba(255,255,255,0.25), transparent)" }}
                    />

                    {/* 호버 시 외곽 글로우 */}
                    <div
                      className="absolute -inset-[1px] rounded-[20px] opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                      style={{
                        background: "linear-gradient(145deg, rgba(96,165,250,0.6), rgba(59,130,246,0.4))",
                        filter: "blur(3px)",
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
                  </>
                )}

                <span className="relative z-10 drop-shadow-[0_2px_8px_rgba(0,0,0,0.3)]">
                  20 문항 풀기 시작
                </span>
              </button>
              {grade !== "2" && (
                <p className="mt-2 max-[380px]:mt-1.5 text-xs max-[380px]:text-[10px] text-slate-500 text-center">
                  현재는 중2만 이용 가능합니다(준비중)
                </p>
              )}
              {error && (
                <div className="mt-4 max-[380px]:mt-3 rounded-lg bg-red-50 p-3 max-[380px]:p-2.5 text-sm max-[380px]:text-xs text-red-600">
                  {error}
                </div>
              )}
            </div>
        </ScreenCard>
      </div>
    </StudentHomeShell>
  );
}

export default function StudentProblemsPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <StudentProblemsPageContent />
    </Suspense>
  );
}
