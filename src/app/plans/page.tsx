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
    <div className="min-h-screen bg-gradient-to-b from-[#e0e7f0] via-[#f0f4f8] to-white px-4 py-12">
      <div className="mx-auto max-w-4xl">
        {/* 헤더 */}
        <div className="mb-8 text-center">
          <h1 className="mb-2 text-3xl font-bold text-[#1e3a8a]">플랜 선택</h1>
          <p className="text-slate-600">원하시는 플랜을 선택해주세요</p>
        </div>

        {/* 플랜 카드 */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* 무료 플랜 */}
          <div className="rounded-2xl border-2 border-[#c7d8e8] bg-white/80 backdrop-blur-xl p-8 shadow-sm transition-all hover:border-[#93c5fd] hover:shadow-md">
            <div className="mb-6">
              <div className="text-3xl font-bold text-slate-900">무료</div>
            </div>

            <ul className="mb-8 space-y-3">
              <li className="flex items-start gap-3">
                <span className="mt-0.5 text-[#1e40af]">✓</span>
                <span className="text-slate-700">문제 생성 2회 (학생/선생님 각1회)</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-0.5 text-[#1e40af]">✓</span>
                <span className="text-slate-700">퀴즈 총 5회 (모든 퀴즈 합산)</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-0.5 text-[#1e40af]">✓</span>
                <span className="text-slate-700">문제 생성 후 인쇄 (선생님 PICK)</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-0.5 text-[#1e40af]">✓</span>
                <span className="text-slate-700">시험지/정답지 PDF 저장 2회</span>
              </li>
            </ul>

            <button
              onClick={handleFreePlan}
              className="group relative overflow-hidden w-full rounded-[16px] h-12 px-6 py-3 text-base font-semibold transition-all duration-500 ease-out active:scale-[0.97] backdrop-blur-xl border border-white/40"
              style={{
                background: "linear-gradient(145deg, rgba(219,234,254,0.9) 0%, rgba(191,219,254,0.85) 50%, rgba(147,197,253,0.8) 100%)",
                boxShadow: "0 8px 24px -4px rgba(30,64,175,0.2), 0 0 0 1px rgba(255,255,255,0.3) inset",
                color: "#1e3a8a",
              }}
            >
              {/* 호버 글로우 효과 */}
              <div className="absolute inset-0 bg-gradient-to-br from-sky-300/0 to-blue-400/0 group-hover:from-sky-300/30 group-hover:to-blue-400/20 transition-all duration-500 pointer-events-none rounded-[16px]" />
              {/* 상단 하이라이트 */}
              <div
                className="absolute top-0 left-0 right-0 h-[45%] opacity-30 group-hover:opacity-50 transition-opacity duration-500 pointer-events-none rounded-t-[16px]"
                style={{ background: "linear-gradient(to bottom, rgba(255,255,255,0.4), transparent)" }}
              />
              {/* 호버시 외곽 글로우 */}
              <div
                className="absolute -inset-[1px] rounded-[16px] opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                style={{
                  background: "linear-gradient(145deg, rgba(96,165,250,0.5), rgba(59,130,246,0.3))",
                  filter: "blur(4px)",
                }}
              />
              <span className="relative z-10">무료로 시작하기</span>
            </button>
          </div>

          {/* 프리미엄 플랜 */}
          <div className="rounded-2xl border-2 border-[#60a5fa] bg-gradient-to-br from-[#eff6ff] via-[#dbeafe] to-[#bfdbfe] p-8 shadow-lg backdrop-blur-xl transition-all hover:border-[#3b82f6] hover:shadow-xl">
            <div className="mb-6">
              <div className="mb-3 flex items-center gap-2">
                <div className="text-2xl font-bold text-[#1e3a8a]">프리미엄 구독하기</div>
                <span className="rounded-full px-2 py-0.5 text-xs font-semibold text-white"
                  style={{
                    background: "linear-gradient(145deg, #1e40af 0%, #1e3a8a 100%)",
                  }}
                >
                  추천
                </span>
              </div>

              {/* 결제 주기 토글 */}
              <div className="mb-3 inline-flex rounded-lg bg-white/80 backdrop-blur-sm p-1 shadow-sm border border-white/40">
                <button
                  onClick={() => setBillingCycle("monthly")}
                  className={`rounded-md px-4 py-1.5 text-sm font-semibold transition-all ${
                    billingCycle === "monthly"
                      ? "text-white"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                  style={billingCycle === "monthly" ? {
                    background: "linear-gradient(145deg, #1e40af 0%, #1e3a8a 100%)",
                  } : {}}
                >
                  월 결제
                </button>
                <button
                  onClick={() => setBillingCycle("yearly")}
                  className={`rounded-md px-4 py-1.5 text-sm font-semibold transition-all ${
                    billingCycle === "yearly"
                      ? "text-white"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                  style={billingCycle === "yearly" ? {
                    background: "linear-gradient(145deg, #1e40af 0%, #1e3a8a 100%)",
                  } : {}}
                >
                  연 결제
                </button>
              </div>

              {/* 가격 */}
              <div className="text-3xl font-bold text-[#1e3a8a]">
                {billingCycle === "monthly" ? "월 9,900원" : "연 89,000원"}
              </div>
              {billingCycle === "yearly" && (
                <div className="mt-1 text-sm text-[#1e40af] font-medium">
                  월 7,417원 (25% 할인)
                </div>
              )}
            </div>

            {/* 프리미엄 혜택 (내용 다시 살림) */}
            <ul className="mb-8 space-y-3">
              <li className="flex items-start gap-3">
                <span className="mt-0.5 text-[#1e40af]">✓</span>
                <span className="font-medium text-slate-900">문제 생성 무제한 (학생/선생님)</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-0.5 text-[#1e40af]">✓</span>
                <span className="font-medium text-slate-900"> 퀴즈 무제한 (모든 유형)</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-0.5 text-[#1e40af]">✓</span>
                <span className="font-medium text-slate-900">누적 리포트 및 통계 그래프</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-0.5 text-[#1e40af]">✓</span>
                <span className="font-medium text-slate-900">문제 인쇄 무제한 (선생님 PICK)</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-0.5 text-[#1e40af]">✓</span>
                <span className="font-medium text-slate-900">시험지/정답지 PDF 저장 (인쇄 모드 지원)</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-0.5 text-[#1e40af]">✓</span>
                <span className="font-medium text-slate-900">모바일에서도 인쇄/공유로 간편 저장</span>
              </li>
            </ul>

            <button
              onClick={handlePremiumPlan}
              disabled={isPaying}
              className="group relative overflow-hidden w-full rounded-[16px] h-12 px-6 py-3 text-base font-semibold text-white transition-all duration-500 ease-out active:scale-[0.97] disabled:opacity-60 disabled:cursor-not-allowed"
              style={{
                background: "linear-gradient(145deg, #1e40af 0%, #1e3a8a 50%, #172554 100%)",
                boxShadow: "0 10px 32px -4px rgba(30,64,175,0.5), 0 0 0 1px rgba(255,255,255,0.1) inset",
              }}
            >
              {/* 호버 그라데이션 오버레이 */}
              <div className="absolute inset-0 bg-gradient-to-br from-blue-400/0 to-blue-600/0 group-hover:from-blue-400/25 group-hover:to-blue-600/15 transition-all duration-500 pointer-events-none" />
              {/* 상단 하이라이트 */}
              <div
                className="absolute top-0 left-0 right-0 h-[45%] opacity-40 group-hover:opacity-60 transition-opacity duration-500 pointer-events-none rounded-t-[16px]"
                style={{ background: "linear-gradient(to bottom, rgba(255,255,255,0.25), transparent)" }}
              />
              {/* 호버시 외곽 글로우 */}
              <div
                className="absolute -inset-[1px] rounded-[16px] opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                style={{
                  background: "linear-gradient(145deg, rgba(96,165,250,0.6), rgba(59,130,246,0.4))",
                  filter: "blur(3px)",
                }}
              />
              {/* 스파클 효과 */}
              <div
                className="absolute inset-0 opacity-0 group-hover:opacity-[0.15] transition-opacity duration-500 pointer-events-none"
                style={{
                  background: `
                    radial-gradient(circle at 15% 30%, rgba(255,255,255,0.7) 0, transparent 2px),
                    radial-gradient(circle at 85% 25%, rgba(255,255,255,0.6) 0, transparent 1.5px),
                    radial-gradient(circle at 70% 70%, rgba(255,255,255,0.65) 0, transparent 2px),
                    radial-gradient(circle at 30% 80%, rgba(255,255,255,0.5) 0, transparent 1.5px)
                  `,
                }}
              />
              <span className="relative z-10 drop-shadow-[0_2px_8px_rgba(0,0,0,0.3)]">
                {isPaying ? "결제 진행 중..." : "프리미엄 시작하기"}
              </span>
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
