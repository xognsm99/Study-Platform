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

  // ✅ oauth redirectTo fixed: localStorage에서 next 경로 복원 (클라이언트 사이드)
  // HTML 응답으로 클라이언트에서 localStorage 읽고 리다이렉트
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>로그인 중...</title>
</head>
<body>
  <div style="display: flex; align-items: center; justify-content: center; min-height: 100vh; font-family: system-ui, -apple-system, sans-serif;">
    <div style="text-align: center;">
      <h2>로그인 성공!</h2>
      <p>잠시만 기다려주세요...</p>
    </div>
  </div>
  <script>
    (function() {
      // localStorage에서 next 경로 복원
      const savedNextPath = localStorage.getItem('oauth_next_path');
      const nextPath = savedNextPath && savedNextPath.startsWith('/') ? savedNextPath : '/ko';

      // localStorage 정리
      localStorage.removeItem('oauth_next_path');

      console.log('[auth/callback] 클라이언트 리다이렉트:', nextPath);

      // 리다이렉트
      window.location.href = nextPath;
    })();
  </script>
</body>
</html>
  `;

  return new NextResponse(html, {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
    },
  });
}
