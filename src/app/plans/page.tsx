"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowser } from "@/lib/supabase/browser";

const PLAN_GATE_KEY = "hasSeenPlanGate";

export default function PlansPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createSupabaseBrowser();

  useEffect(() => {
    async function checkAuth() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          // 로그인되지 않은 경우 로그인 페이지로 리다이렉트
          router.push("/auth");
          return;
        }

        // 이미 플랜 게이트를 본 경우 학생 설정으로 이동
        const hasSeenPlanGate = localStorage.getItem(PLAN_GATE_KEY) === "true";
        if (hasSeenPlanGate) {
          router.push("/ko/student/setup");
          return;
        }

        setIsLoading(false);
      } catch (error) {
        console.error("Failed to check auth", error);
        router.push("/auth");
      }
    }

    checkAuth();
  }, [router, supabase]);

  const handleFreePlan = () => {
    // 무료 플랜 선택 시
    localStorage.setItem(PLAN_GATE_KEY, "true");
    router.push("/ko/student/setup");
  };

  const handlePremiumPlan = () => {
    // 프리미엄 플랜 선택 시
    localStorage.setItem(PLAN_GATE_KEY, "true");
    
    // TODO: 결제 페이지가 준비되면 결제 페이지로 이동
    // 임시로 학생 설정으로 이동 + 토스트
    router.push("/ko/student/setup");
    
    // 토스트 메시지 표시 (간단한 alert로 대체)
    setTimeout(() => {
      alert("프리미엄 기능은 준비중입니다. 곧 만나보실 수 있습니다!");
    }, 500);
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="mb-4 text-slate-600">로딩 중...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-12">
      <div className="mx-auto max-w-4xl">
        {/* 헤더 */}
        <div className="mb-8 text-center">
          <h1 className="mb-2 text-3xl font-bold text-slate-900">플랜 선택</h1>
          <p className="text-slate-600">원하시는 플랜을 선택해주세요</p>
        </div>

        {/* 플랜 카드 */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* 무료 플랜 */}
          <div className="rounded-2xl border-2 border-slate-200 bg-white p-8 shadow-sm transition-all hover:border-slate-300 hover:shadow-md">
            <div className="mb-6">
              <div className="mb-2 text-2xl font-bold text-slate-900">무료로 이용하기</div>
              <div className="text-3xl font-bold text-slate-900">무료</div>
            </div>

            {/* 장점 리스트 */}
            <ul className="mb-8 space-y-3">
              <li className="flex items-start gap-3">
                <span className="mt-0.5 text-green-600">✓</span>
                <span className="text-slate-700">기본 문제 생성 (일일 1세트)</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-0.5 text-green-600">✓</span>
                <span className="text-slate-700">결과 미리보기</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-0.5 text-green-600">✓</span>
                <span className="text-slate-700">엄마한테 제출</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-0.5 text-green-600">✓</span>
                <span className="text-slate-700">다시 풀기 / 다른 문제 생성</span>
              </li>
            </ul>

            {/* 선택 버튼 */}
            <button
              onClick={handleFreePlan}
              className="w-full rounded-lg bg-slate-900 px-6 py-3 text-base font-semibold text-white transition-colors hover:bg-slate-800 active:bg-slate-700"
            >
              무료로 시작하기
            </button>
          </div>

          {/* 프리미엄 플랜 */}
          <div className="rounded-2xl border-2 border-blue-500 bg-gradient-to-br from-blue-50 to-blue-100 p-8 shadow-lg transition-all hover:border-blue-600 hover:shadow-xl">
            <div className="mb-6">
              <div className="mb-2 flex items-center gap-2">
                <div className="text-2xl font-bold text-slate-900">프리미엄 구독하기</div>
                <span className="rounded-full bg-blue-600 px-2 py-0.5 text-xs font-semibold text-white">
                  추천
                </span>
              </div>
              <div className="text-3xl font-bold text-slate-900">월 9,900원</div>
              <div className="mt-1 text-sm text-slate-600">또는 연간 구독 시 할인</div>
            </div>

            {/* 장점 리스트 */}
            <ul className="mb-8 space-y-3">
              <li className="flex items-start gap-3">
                <span className="mt-0.5 text-blue-600">✓</span>
                <span className="font-medium text-slate-900">무제한 세트 생성</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-0.5 text-blue-600">✓</span>
                <span className="font-medium text-slate-900">나의 진행 상황 (누적 그래프)</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-0.5 text-blue-600">✓</span>
                <span className="font-medium text-slate-900">힌트 +3 추가</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-0.5 text-blue-600">✓</span>
                <span className="font-medium text-slate-900">타임스탑 2회 제공</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-0.5 text-blue-600">✓</span>
                <span className="font-medium text-slate-900">주간 리포트 자동 제출</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-0.5 text-blue-600">✓</span>
                <span className="font-medium text-slate-900">모든 무료 기능 포함</span>
              </li>
            </ul>

            {/* 선택 버튼 */}
            <button
              onClick={handlePremiumPlan}
              className="w-full rounded-lg bg-blue-600 px-6 py-3 text-base font-semibold text-white transition-colors hover:bg-blue-700 active:bg-blue-800"
            >
              프리미엄 시작하기
            </button>
          </div>
        </div>

        {/* 안내 문구 */}
        <div className="mt-8 text-center text-sm text-slate-500">
          언제든지 설정에서 플랜을 변경할 수 있습니다.
        </div>
      </div>
    </div>
  );
}
