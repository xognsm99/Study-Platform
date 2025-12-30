"use client";

import { useSearchParams } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase-browser";

export default function AuthForm() {
  const searchParams = useSearchParams();

  const handleOAuth = async (provider: "google" | "kakao") => {
    const supabase = supabaseBrowser();

    const nextParam = searchParams?.get("next");
    const nextPath = nextParam && nextParam.startsWith("/") ? nextParam : "/ko";

    // Supabase 대시보드 Redirect URLs에 반드시 포함되어 있어야 함:
    // http://localhost:3000/auth/callback
    const redirectTo =
      `${window.location.origin}/auth/callback?next=${encodeURIComponent(nextPath)}`;

    console.log("[OAuth] provider =", provider);
    console.log("[OAuth] redirectTo =", redirectTo);

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo,
        // ✅ 자동 이동이 안 먹는 경우가 있어서, url을 받아 우리가 직접 이동시킬 거다.
        // skipBrowserRedirect 값이 어딘가에서 true로 들어가면 자동이 막힘.
        // 여기서는 넣지 않는다(기본값).
      },
    });

    console.log("[OAuth] data.url =", data?.url);
    console.log("[OAuth] error =", error);

    if (error) {
      console.error("[OAuth] signInWithOAuth error:", error);
      alert(error.message);
      return;
    }

    // ✅ 핵심: 여기서 무조건 실제 이동
    if (data?.url) {
      window.location.assign(data.url);
      return;
    }

    alert("OAuth URL이 없습니다. Supabase 설정을 확인하세요.");
  };

  return (
    <div className="w-full max-w-[420px] mx-auto px-4">
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
        <div className="mb-6 text-center">
          <h2 className="text-2xl font-bold text-slate-900 mb-2">로그인</h2>
          <p className="text-sm text-slate-600">소셜 계정으로 간편하게 시작하세요</p>
        </div>

        <div className="flex flex-col gap-3">
          {/* Google 로그인 버튼 */}
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              void handleOAuth("google");
            }}
            className="relative flex items-center justify-center gap-3 w-full rounded-xl border-2 border-slate-300 bg-white px-4 py-3.5 text-base font-semibold text-slate-800 transition-all hover:border-slate-400 hover:bg-slate-50 active:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2"
          >
            <img src="/icons/google.svg" alt="Google" className="w-5 h-5" />
            <span>Google로 로그인</span>
          </button>

          {/* Kakao 로그인 버튼 */}
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              void handleOAuth("kakao");
            }}
            className="relative flex items-center justify-center gap-3 w-full rounded-xl border-2 border-[#FEE500] bg-[#FEE500] px-4 py-3.5 text-base font-semibold text-slate-900 transition-all hover:bg-[#FDD835] hover:border-[#FDD835] active:bg-[#FBC02D] focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:ring-offset-2"
          >
            <img src="/icons/kakao.svg" alt="Kakao" className="w-5 h-5" />
            <span>Kakao로 로그인</span>
          </button>
        </div>

        <div className="mt-4 text-center">
          <p className="text-xs text-slate-500">
            로그인 시 서비스 이용약관 및 개인정보 처리방침에 동의합니다
          </p>
        </div>
      </div>
    </div>
  );
}
