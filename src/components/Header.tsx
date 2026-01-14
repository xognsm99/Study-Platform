"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase-browser";

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  // Extract locale from pathname, default to "ko"
  const locale = pathname?.split("/")[1] || "ko";

  const [isLoading, setIsLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const supabase = supabaseBrowser();

  useEffect(() => {
    async function checkAuth() {
      try {
        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser();

        // 사용자가 없거나 에러가 발생하면 즉시 리턴
        if (authError || !user?.id) {
          setIsLoggedIn(false);
          setIsLoading(false);
          return;
        }

        setIsLoggedIn(true);
      } catch (error) {
        // 전체 에러 핸들링
        console.debug("checkAuth error (non-fatal):", error);
        setIsLoggedIn(false);
      } finally {
        setIsLoading(false);
      }
    }

    checkAuth();

    // 인증 상태 변경 감지
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user?.id) {
        setIsLoggedIn(true);
      } else {
        setIsLoggedIn(false);
      }
      setIsLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/auth");
    router.refresh();
  };

  return (
    <header className="sticky top-0 z-50 border-b bg-white">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-3">
        {/* ✅ 앱 이름 */}
        <Link
         href="/"
         className="text-lg md:text-2xl font-bold text-slate-900 whitespace-nowrap tracking-tight"
         >
         STUDY PICK
        </Link>


        {/* ✅ 우측 메뉴 */}
        <div className="flex items-center gap-3 text-sm text-slate-600">
          {isLoading ? (
            // 로딩 중: 텍스트 자리 비움 (레이아웃 깨지지 않게)
            <span className="invisible">로딩 중...</span>
          ) : !isLoggedIn ? (
            // 로그인 안 됨: 로그인 버튼
            <Link href="/auth" className="hover:text-slate-900">
              로그인
            </Link>
          ) : (
            // 로그인 됨: 프로필 + 로그아웃
            <>
              <Link
                href={`/${locale}/student?edit=true`}
                className="group relative overflow-hidden px-4 py-2 rounded-[14px] text-sm font-semibold no-underline transition-all duration-300 ease-out select-none active:scale-[0.95]"
                style={{
                  background: "linear-gradient(145deg, #93c5fd 0%, #60a5fa 50%, #3b82f6 100%)",
                  boxShadow: "0 4px 12px -2px rgba(59,130,246,0.3), 0 0 0 1px rgba(255,255,255,0.2) inset",
                  color: "white",
                }}
              >
                {/* 호버 시 밝아지는 오버레이 */}
                <div className="absolute inset-0 bg-gradient-to-br from-blue-300/0 to-blue-500/0 group-hover:from-blue-300/25 group-hover:to-blue-500/15 transition-all duration-300 pointer-events-none" />

                {/* 상단 글로우 */}
                <div
                  className="absolute top-0 left-0 right-0 h-[45%] opacity-50 group-hover:opacity-70 transition-opacity duration-300 pointer-events-none rounded-t-[14px]"
                  style={{
                    background: "linear-gradient(to bottom, rgba(255,255,255,0.4), transparent)",
                  }}
                />

                <span className="relative z-10">프로필</span>
              </Link>
              <button
                onClick={handleLogout}
                className="hover:text-slate-900 text-slate-600 transition-colors"
              >
                로그아웃
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
