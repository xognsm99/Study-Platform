import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;

  // ✅ 공개 경로는 모두 통과
  if (
    pathname.startsWith("/auth") ||          // /auth, /auth/callback 모두 포함
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname === "/favicon.ico" ||
    pathname.includes(".")                   // 정적 파일(확장자 포함): /google.png 등
  ) {
    return NextResponse.next();
  }

  const res = NextResponse.next();

  // Supabase 클라이언트 생성 (middleware용)
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => req.cookies.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value, options }) => {
            res.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  // 현재 사용자 확인 (세션 refresh 포함)
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // 비로그인 상태에서 나머지 경로 접근 시 /auth?next=... 로 리다이렉트
  if (!user) {
    const url = req.nextUrl.clone();
    url.pathname = "/auth";
    const next = pathname + search;
    url.searchParams.set("next", next);
    return NextResponse.redirect(url);
  }

  return res;
}

export const config = {
  matcher: [
    "/auth/:path*",
    "/plans/:path*",
    "/student/:path*",
    "/setup/:path*",
    // ✅ 정적 파일(.*)과 _next, api 등은 제외
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)",
  ],
};
