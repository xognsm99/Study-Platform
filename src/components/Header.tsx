"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createSupabaseBrowser } from "@/lib/supabase/browser";

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  // Extract locale from pathname, default to "ko"
  const locale = pathname?.split("/")[1] || "ko";

  const [isLoading, setIsLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const supabase = createSupabaseBrowser();

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
    <header className="border-b bg-white">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-3">
        {/* ✅ 앱 이름 */}
        <Link href="/" className="text-base font-semibold text-slate-900">
          스터디 플랫폼
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
            // 로그인 됨: 로그아웃만 표시
            <button
              onClick={handleLogout}
              className="hover:text-slate-900 text-slate-600"
            >
              로그아웃
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
