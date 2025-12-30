import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

const DEFAULT_LOCALE = "ko";
const LOCALES = ["ko", "en"]; // 필요하면 더 추가

export async function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;

  // ✅ CRITICAL: /auth 경로는 절대 리다이렉트 금지 (OAuth 플로우 보호)
  if (pathname === "/auth" || pathname.startsWith("/auth/")) {
    return NextResponse.next();
  }

  // ✅ 공개 경로는 모두 통과
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname === "/favicon.ico" ||
    pathname === "/plans" || // 구독 안내 페이지는 항상 열림
    pathname.startsWith("/ko/plans") || // /{locale}/plans 도 열림
    pathname.startsWith("/en/plans") ||
    pathname.includes(".") // 정적 파일
  ) {
    return NextResponse.next();
  }

  // ✅ 이미 /ko/... /en/... 이면 로케일 처리된 경로 (무한 루프 방지)
  const hasLocale = LOCALES.some((loc) => pathname === `/${loc}` || pathname.startsWith(`/${loc}/`));

  // ✅ 레거시 경로 -> /ko/.. 로 강제 통일 (Supabase 만들기 전에!)
  if (!hasLocale) {
    // /teacher -> /ko/teacher (하위 포함)
    if (pathname === "/teacher" || pathname.startsWith("/teacher/")) {
      const url = req.nextUrl.clone();
      url.pathname = `/${DEFAULT_LOCALE}${pathname}`;
      url.search = search;
      return NextResponse.redirect(url);
    }

    // /student -> /ko/student (하위 포함)
    if (pathname === "/student" || pathname.startsWith("/student/")) {
      const url = req.nextUrl.clone();
      url.pathname = `/${DEFAULT_LOCALE}${pathname}`;
      url.search = search;
      return NextResponse.redirect(url);
    }

    // /profile -> /ko/my
    if (pathname === "/profile") {
      const url = req.nextUrl.clone();
      url.pathname = `/${DEFAULT_LOCALE}/my`;
      url.search = search;
      return NextResponse.redirect(url);
    }
  }

  // 여기부터는 기존 로직 그대로 (로그인 체크)
  const res = NextResponse.next();

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

  const {
    data: { user },
  } = await supabase.auth.getUser();

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
    // ✅ 정적 파일(.*)과 _next, api 등은 제외
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)",
  ],
};
