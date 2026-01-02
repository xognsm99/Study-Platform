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
  { value: "1-3", label: "1~3 단원" },
  { value: "4-6", label: "4~6 단원" },
  { value: "7-9", label: "7~9 단원" },
  { value: "10-12", label: "10~12 단원" },
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
    new Set(["vocab", "grammar", "reading", "dialogue"])
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
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-violet-100/80 backdrop-blur-sm">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-violet-200 border-t-violet-600"></div>
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
        <ScreenTitle>문제 PICK</ScreenTitle>

        <ScreenCard>
            {/* 문제 유형 선택 */}
            <div>
              <div>
                <div className="text-lg font-semibold text-[#2A2457] mb-4">
                  문제 유형 선택
                </div>
                <div className="grid grid-cols-2 gap-3 max-[380px]:gap-2">
                  {GROUPS.map((group) => (
                    <label
                      key={group.key}
                      className={`flex items-center gap-2 max-[380px]:gap-1.5 rounded-2xl border bg-white px-5 py-3 max-[380px]:px-3 max-[380px]:py-1.5 cursor-pointer transition-colors ${
                        selectedGroups.has(group.key)
                          ? "border-[#6E63D5] bg-[#F0EFFF] hover:bg-[#E6E2FF]"
                          : "border-[#E6E2FF] hover:border-[#B9B4E4] hover:bg-[#F0EFFF]"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selectedGroups.has(group.key)}
                        onChange={() => handleGroupToggle(group.key)}
                        className="h-8 w-4 max-[380px]:h-3.5 max-[380px]:w-3.5 rounded border-gray-300 accent-[#B9B4E4] focus:ring-[#B9B4E4] focus:ring-2 focus:ring-offset-0"
                      />
                      <span className="text-lg max-[380px]:text-xs font-medium text-slate-800">{group.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* 20문항 풀기 시작 버튼 */}
            <div className="mt-5 max-[380px]:mt-4">
              <button
                onClick={handleStart}
                disabled={!canProceed || loading}
                className="w-full h-16 max-[380px]:h-10 rounded-2xl bg-gradient-to-r from-[#6E63D5] to-[#8A7CF0] px-4 text-2xl max-[380px]:text-xs text-white font-semibold shadow-[0_12px_26px_rgba(110,99,213,0.35)] hover:from-[#5B52C8] hover:to-[#7A6FE0] transition-all disabled:cursor-not-allowed disabled:bg-gray-300 disabled:hover:bg-gray-300 disabled:opacity-50 disabled:from-gray-300 disabled:to-gray-300"
              >
                20 문항 풀기 시작
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
