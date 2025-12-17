import { NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/server";

/**
 * OAuth 콜백 라우트
 * 소셜 로그인 성공 후 Supabase에서 리다이렉트되는 엔드포인트
 */
export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");

  try {
    if (!code) {
      console.error("[auth/callback] Missing `code` query parameter");
      return NextResponse.redirect(new URL("/auth?error=oauth", request.url));
    }

    const supabase = await createSupabaseServer();

    // 인증 코드를 세션으로 교환
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      console.error("[auth/callback] exchangeCodeForSession error:", error);
      return NextResponse.redirect(new URL("/auth?error=oauth", request.url));
    }

    // (선택) 프로필 존재 여부 확인 후 없으면 기본 프로필 생성
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("id")
        .eq("id", user.id)
        .maybeSingle();

      if (profileError) {
        console.error("[auth/callback] profiles query error:", profileError);
      }

      if (!profile) {
        const { error: upsertError } = await supabase.from("profiles").upsert({
          id: user.id,
          email: user.email,
          role: "student",
          subscription_status: "free",
        });

        if (upsertError) {
          console.error("[auth/callback] profiles upsert error:", upsertError);
        }
      }
    }

    // ✅ 로그인 성공 시 next 파라미터가 있으면 그쪽으로, 없으면 "/"로 이동
    const next = requestUrl.searchParams.get("next") || "/";
    return NextResponse.redirect(new URL(next, requestUrl.origin));
  } catch (e: any) {
    console.error("[auth/callback] Unexpected error:", e);
    return NextResponse.redirect(new URL("/auth?error=oauth", request.url));
  }
}
