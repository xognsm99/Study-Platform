"use client";

import * as PortOne from "@portone/browser-sdk/v2";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase-browser";

const PLAN_GATE_KEY = "hasSeenPlanGate";

function makePaymentId(prefix: string) {
  // 안전한 영숫자 ID (특수문자/길이 이슈 방지)
  const rand = Math.random().toString(36).slice(2, 10);
  return `${prefix}${Date.now()}${rand}`.slice(0, 40);
}

export default function PlansPage() {
  const router = useRouter();
  const supabase = useMemo(() => supabaseBrowser(), []);

  const [isPaying, setIsPaying] = useState(false);
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");

  const handleFreePlan = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push("/auth?next=/plans");
      return;
    }

    localStorage.setItem(PLAN_GATE_KEY, "true");
    router.push("/ko/student");
  };

  const handlePremiumPlan = async () => {
    if (isPaying) return;

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push("/auth?next=/plans");
      return;
    }

    const storeId = process.env.NEXT_PUBLIC_PORTONE_STORE_ID;
    const channelKey = process.env.NEXT_PUBLIC_PORTONE_CHANNEL_KEY;

    if (!storeId || !channelKey) {
      alert("포트원 storeId/channelKey가 없습니다. .env.local 확인하세요.");
      return;
    }

    const totalAmount = billingCycle === "yearly" ? 89000 : 9900;
    const orderName =
      billingCycle === "yearly" ? "스터디픽 프리미엄 연간" : "스터디픽 프리미엄 월간";

    const paymentId = makePaymentId(billingCycle === "yearly" ? "spy" : "spm");

    setIsPaying(true);

    try {
      // ✅ 모바일 감지
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

      // ✅ 코스페이먼트 채널은 간편결제 전용인 경우가 많아서 EASY_PAY로 요청해야 함
      const res = await PortOne.requestPayment({
        storeId,
        channelKey,
        paymentId,
        orderName,
        totalAmount,
        currency: "CURRENCY_KRW",
        payMethod: "EASY_PAY", // ⭐ 핵심 수정

        // ✅ 모바일에서는 REDIRECTION 방식 강제 (PC는 자동, 모바일은 리다이렉트)
        windowType: isMobile
          ? { pc: "IFRAME", mobile: "REDIRECTION" }
          : { pc: "IFRAME", mobile: "REDIRECTION" },

        // 모바일 결제 후 복귀용
        redirectUrl: `${window.location.origin}/payment-redirect?cycle=${billingCycle}`,

        customer: {
          customerId: user.id,
          fullName:
            (user.user_metadata?.name as string) ||
            (user.user_metadata?.full_name as string) ||
            user.email ||
            "스터디픽 사용자",
          email: user.email ?? undefined,
        },

        // (선택) 특정 간편결제사 고정하고 싶으면 주석 해제 후 사용
        // easyPay: { easyPayProvider: "KAKAOPAY" },
      });

      // ✅ 모바일 리다이렉트 처리: 응답이 없으면 모바일에서 리다이렉트된 것으로 간주
      // (requestPayment가 리다이렉트하면 이 코드는 실행되지 않음)
      if (!res) {
        // 모바일에서는 리다이렉트되므로 여기 도달 안함
        console.log("모바일 결제 리다이렉트 대기 중...");
        return;
      }

      // 취소/실패
      if ((res as any)?.code) {
        alert((res as any)?.message || "결제 취소/실패");
        return;
      }

      // ✅ PC 결제는 여기서 바로 검증 (transactionType이 PAYMENT인 경우)
      const verify = await fetch("/api/portone/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentId, cycle: billingCycle }),
      });

      const data = await verify.json().catch(() => ({}));
      if (!verify.ok) {
        alert(data?.error || "결제 검증 실패");
        return;
      }

      // ✅ 성공일 때만 게이트 통과
      localStorage.setItem(PLAN_GATE_KEY, "true");
      router.push("/ko/student/setup");
    } catch (e) {
      console.error(e);
      alert("결제 처리 중 오류가 발생했습니다.");
    } finally {
      setIsPaying(false);
    }
  };

  return (
    <div className="min-h-screen bg-sky-50 dark:bg-sky-50 px-4 py-12">
      <div className="mx-auto max-w-4xl">
        {/* 헤더 */}
        <div className="mb-8 text-center">
          <h1 className="mb-2 text-3xl font-bold text-slate-900">플랜 선택</h1>
          <p className="text-slate-600">원하시는 플랜을 선택해주세요</p>
        </div>

        {/* 플랜 카드 */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* 무료 플랜 */}
          <div className="rounded-2xl border-2 border-[#D9D5F5] bg-white p-8 shadow-sm transition-all hover:border-[#B9B4E4] hover:shadow-md">
            <div className="mb-6">
              <div className="text-3xl font-bold text-slate-900">무료</div>
            </div>

            <ul className="mb-8 space-y-3">
              <li className="flex items-start gap-3">
                <span className="mt-0.5 text-[#6E63D5]">✓</span>
                <span className="text-slate-700">문제 생성 2회 (학생/선생님 각1회)</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-0.5 text-[#6E63D5]">✓</span>
                <span className="text-slate-700">퀴즈 총 5회 (모든 퀴즈 합산)</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-0.5 text-[#6E63D5]">✓</span>
                <span className="text-slate-700">문제 생성 후 인쇄 (선생님 PICK)</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-0.5 text-[#6E63D5]">✓</span>
                <span className="text-slate-700">시험지/정답지 PDF 저장 2회</span>
              </li>
            </ul>

            <button
              onClick={handleFreePlan}
              className="w-full rounded-xl h-12 bg-[#E9E6FF] px-6 py-3 text-base font-semibold text-[#6E63D5] transition-all hover:bg-[#D9D5F5] active:scale-[0.98]"
            >
              무료로 시작하기
            </button>
          </div>

          {/* 프리미엄 플랜 */}
          <div className="rounded-2xl border-2 border-[#8A7CF0] bg-gradient-to-br from-[#F6F5FF] to-[#E9E6FF] p-8 shadow-lg transition-all hover:border-[#6E63D5] hover:shadow-xl">
            <div className="mb-6">
              <div className="mb-3 flex items-center gap-2">
                <div className="text-2xl font-bold text-slate-900">프리미엄 구독하기</div>
                <span className="rounded-full bg-[#6E63D5] px-2 py-0.5 text-xs font-semibold text-white">
                  추천
                </span>
              </div>

              {/* 결제 주기 토글 */}
              <div className="mb-3 inline-flex rounded-lg bg-white p-1 shadow-sm">
                <button
                  onClick={() => setBillingCycle("monthly")}
                  className={`rounded-md px-4 py-1.5 text-sm font-semibold transition-colors ${
                    billingCycle === "monthly"
                      ? "bg-[#6E63D5] text-white"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  월 결제
                </button>
                <button
                  onClick={() => setBillingCycle("yearly")}
                  className={`rounded-md px-4 py-1.5 text-sm font-semibold transition-colors ${
                    billingCycle === "yearly"
                      ? "bg-[#6E63D5] text-white"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  연 결제
                </button>
              </div>

              {/* 가격 */}
              <div className="text-3xl font-bold text-slate-900">
                {billingCycle === "monthly" ? "월 9,900원" : "연 89,000원"}
              </div>
              {billingCycle === "yearly" && (
                <div className="mt-1 text-sm text-[#6E63D5] font-medium">
                  월 7,417원 (25% 할인)
                </div>
              )}
            </div>

            {/* 프리미엄 혜택 (내용 다시 살림) */}
            <ul className="mb-8 space-y-3">
              <li className="flex items-start gap-3">
                <span className="mt-0.5 text-[#6E63D5]">✓</span>
                <span className="font-medium text-slate-900">문제 생성 무제한 (학생/선생님)</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-0.5 text-[#6E63D5]">✓</span>
                <span className="font-medium text-slate-900"> 퀴즈 무제한 (모든 유형)</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-0.5 text-[#6E63D5]">✓</span>
                <span className="font-medium text-slate-900">누적 리포트 및 통계 그래프</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-0.5 text-[#6E63D5]">✓</span>
                <span className="font-medium text-slate-900">문제 인쇄 무제한 (선생님 PICK)</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-0.5 text-[#6E63D5]">✓</span>
                <span className="font-medium text-slate-900">시험지/정답지 PDF 저장 (인쇄 모드 지원)</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-0.5 text-[#6E63D5]">✓</span>
                <span className="font-medium text-slate-900">모바일에서도 인쇄/공유로 간편 저장</span>
              </li>
            </ul>

            <button
              onClick={handlePremiumPlan}
              disabled={isPaying}
              className="w-full rounded-xl h-12 bg-[#6E63D5] px-6 py-3 text-base font-semibold text-white transition-all hover:bg-[#5B52C8] hover:shadow-md active:scale-[0.98] disabled:opacity-60"
            >
              {isPaying ? "결제 진행 중..." : "프리미엄 시작하기"}
            </button>
          </div>
        </div>

        <div className="mt-8 text-center text-sm text-slate-500">
          언제든지 설정에서 플랜을 변경할 수 있습니다.
        </div>
      </div>
    </div>
  );
}
