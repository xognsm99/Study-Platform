"use client";

import { useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";

function PaymentRedirectContent() {
  const sp = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    const paymentId = sp.get("paymentId");
    const cycle = (sp.get("cycle") as "monthly" | "yearly") || "monthly";
    const code = sp.get("code");
    const message = sp.get("message");

    if (code) {
      alert(message || "결제 실패/취소");
      router.replace("/plans");
      return;
    }

    if (!paymentId) {
      alert("paymentId 없음");
      router.replace("/plans");
      return;
    }

    (async () => {
      const verify = await fetch("/api/portone/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentId, cycle }),
      });

      const data = await verify.json().catch(() => ({}));
      if (!verify.ok) {
        alert(data?.error || "결제 검증 실패");
        router.replace("/plans");
        return;
      }

      localStorage.setItem("hasSeenPlanGate", "true");
      router.replace("/ko/student/setup");
    })();
  }, [sp, router]);

  return <div className="min-h-screen flex items-center justify-center">결제 처리중...</div>;
}

export default function PaymentRedirectPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <PaymentRedirectContent />
    </Suspense>
  );
}
