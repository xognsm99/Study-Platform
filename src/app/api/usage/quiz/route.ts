import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { consumeFreeUsage } from "@/lib/usage";
import { cookies } from "next/headers";

export const runtime = "nodejs";

/**
 * 퀴즈/단어게임 시작 시 무료 사용 제한 체크
 * - POST 요청으로 quiz 1회 차감
 * - 제한 초과 시 403 { needsSubscription: true, reason: "quiz" } 반환
 */
export async function POST(req: Request) {
  // 환경 변수 체크
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json(
      { ok: false, error: "Supabase 환경 변수가 설정되지 않았습니다." },
      { status: 500 }
    );
  }

  // 사용자 인증 확인
  let userId: string | null = null;
  try {
    const cookieStore = await cookies();
    const accessToken = cookieStore.get("sb-access-token")?.value;
    const refreshToken = cookieStore.get("sb-refresh-token")?.value;

    if (accessToken && refreshToken) {
      const authClient = createClient(
        process.env.SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { auth: { persistSession: false } }
      );
      await authClient.auth.setSession({ access_token: accessToken, refresh_token: refreshToken });
      const { data: { user } } = await authClient.auth.getUser();
      userId = user?.id ?? null;
    }
  } catch (authError) {
    console.warn("[usage/quiz] 인증 확인 실패:", authError);
  }

  // 로그인하지 않은 경우 요청 거부
  if (!userId) {
    return NextResponse.json(
      { ok: false, error: "로그인이 필요합니다." },
      { status: 401 }
    );
  }

  // 무료 사용 제한 체크
  try {
    const gate = await consumeFreeUsage(userId, "quiz");
    if (!gate.allowed) {
      console.log(`[usage/quiz] 무료 제한 초과: userId=${userId}, remaining=${gate.remaining}`);
      return NextResponse.json(
        { needsSubscription: true, reason: "quiz" },
        { status: 403 }
      );
    }
    console.log(`[usage/quiz] 무료 제한 통과: userId=${userId}, remaining=${gate.remaining}`);
    return NextResponse.json({ ok: true, remaining: gate.remaining });
  } catch (usageError) {
    console.error("[usage/quiz] consumeFreeUsage 에러:", usageError);
    return NextResponse.json(
      { ok: false, error: "사용 제한 확인 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
