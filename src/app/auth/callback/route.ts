import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const nextParam = requestUrl.searchParams.get("next");

  console.log("[auth/callback] 요청 URL:", requestUrl.href);
  console.log("[auth/callback] code:", code ? `${code.substring(0, 20)}...` : "없음");
  console.log("[auth/callback] next:", nextParam);

  // 보안: 외부 URL 무시 (open redirect 방지)
  const isRelativePath = nextParam && !nextParam.startsWith("http") && !nextParam.startsWith("//");
  const next = isRelativePath ? nextParam : "/ko";

  if (!code) {
    console.error("[auth/callback] code 파라미터가 없음 - /auth로 리다이렉트");
    return NextResponse.redirect(new URL("/auth", request.url));
  }

  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        },
      },
    }
  );

  // PKCE 코드 교환
  console.log("[auth/callback] exchangeCodeForSession 시작...");
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    console.error("[auth/callback] exchangeCodeForSession 에러:", error);
    console.error("[auth/callback] 에러 상세:", JSON.stringify(error, null, 2));
    return NextResponse.redirect(new URL("/auth", request.url));
  }

  console.log("[auth/callback] ✅ 세션 교환 성공! 쿠키 설정됨");
  console.log(`[auth/callback] ${next} 로 리다이렉트`);

  // 성공 시 next 경로로 리다이렉트
  return NextResponse.redirect(new URL(next, request.url));
}
