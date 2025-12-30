"use client";

import { Suspense } from "react";
import AuthForm from "@/components/AuthForm";

function AuthFormWrapper() {
  return <AuthForm />;
}

export default function AuthPage() {
  // 자동 리다이렉트 제거 - AuthForm에서 next 파라미터 처리

  return (
    <div className="min-h-screen flex items-start justify-center bg-slate-50 px-4 py-10">
      <div className="w-full max-w-md">
        <Suspense fallback={<div className="text-center">Loading...</div>}>
          <AuthFormWrapper />
        </Suspense>
      </div>
    </div>
  );
}
