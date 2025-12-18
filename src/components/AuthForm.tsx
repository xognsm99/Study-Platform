"use client";

import { useState } from "react";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase-browser";

export default function AuthForm() {
  const searchParams = useSearchParams();
  const [msg, setMsg] = useState<string | null>(null);
  const [socialLoading, setSocialLoading] = useState<string | null>(null);

  const redirectTo =
    typeof window !== "undefined"
      ? `${window.location.origin}/auth/callback`
      : undefined;

  async function loginWith(provider: "google" | "kakao" | "naver") {
    setSocialLoading(provider);
    setMsg(null);

    try {
      const { error } = await supabaseBrowser.auth.signInWithOAuth({
        provider,
        options: { redirectTo },
      });

      if (error) {
        console.error("[OAuth] signInWithOAuth error:", error);
        const message = error.message ?? `${provider} 로그인 중 오류가 발생했습니다.`;
        alert(message);
        setMsg(message);
        setSocialLoading(null);
      }
    } catch (e: any) {
      console.error("[OAuth] unexpected error:", e);
      const message = e?.message ?? `${provider} 로그인 중 오류가 발생했습니다.`;
      alert(message);
      setMsg(message);
      setSocialLoading(null);
    }
  }

  return (
    <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
      {/* 소셜 로그인 버튼 */}
      <div className="space-y-3">
        {/* Google */}
        <button
          onClick={() => loginWith("google")}
          disabled={!!socialLoading}
          className="relative w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-12 pr-4 text-base font-semibold text-slate-700 transition-colors hover:bg-slate-50 active:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-white"
        >
          <span className="absolute left-4 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-lg bg-white/70">
            <Image src="/google.png" alt="Google" width={20} height={20} />
          </span>
          {socialLoading === "google" ? "처리 중..." : "Google 로그인"}
        </button>

        {/* Kakao */}
        <button
          onClick={() => loginWith("kakao")}
          disabled={!!socialLoading}
          className="relative w-full rounded-xl bg-[#FEE500] py-2.5 pl-12 pr-4 text-base font-semibold text-slate-900 transition-colors hover:bg-[#FDD835] active:bg-[#FBC02D] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-[#FEE500]"
        >
          <span className="absolute left-4 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-lg bg-white/70">
            <Image src="/kakao.png" alt="Kakao" width={20} height={20} />
          </span>
          {socialLoading === "kakao" ? "처리 중..." : "kakao 로그인"}
        </button>

        {/* Naver */}
        <button
          onClick={() => loginWith("naver")}
          disabled={!!socialLoading}
          className="relative w-full rounded-xl bg-[#03C75A] py-2.5 pl-12 pr-4 text-base font-semibold text-white transition-colors hover:bg-[#02B350] active:bg-[#029640] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-[#03C75A]"
        >
          <span className="absolute left-4 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-lg bg-white/70">
            <Image src="/naver.png" alt="Naver" width={20} height={20} />
          </span>
          {socialLoading === "naver" ? "처리 중..." : "Naver 로그인"}
        </button>
      </div>

      {/* 메시지 */}
      {msg && (
        <div className="mt-4 rounded-lg bg-slate-50 px-4 py-3 text-sm text-slate-700">
          {msg}
        </div>
      )}
    </div>
  );
}
