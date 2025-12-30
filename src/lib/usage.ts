import { createClient } from "@supabase/supabase-js";

/**
 * 무료 사용 제한 소진 함수
 * - Supabase RPC public.consume_free_usage 호출
 * - 서버 전용 (SUPABASE_SERVICE_ROLE_KEY 필요)
 */
export async function consumeFreeUsage(
  userId: string,
  kind: "quiz" | "student_generate" | "teacher_generate"
): Promise<{ allowed: boolean; remaining: number }> {
  // 환경 변수 체크
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL 환경 변수가 설정되지 않았습니다.");
  }
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY 환경 변수가 설정되지 않았습니다.");
  }

  // Service Role 클라이언트 생성 (RLS 무시)
  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false } }
  );

  try {
    // RPC 호출
    const { data, error } = await admin.rpc("consume_free_usage", {
      p_user_id: userId,
      p_kind: kind,
    });

    if (error) {
      console.error("[usage.ts] RPC consume_free_usage 에러:", error);
      throw new Error(`무료 사용 제한 확인 실패: ${error.message}`);
    }

    // RPC 응답 처리: 배열 또는 단일 객체 대응
    const result = Array.isArray(data) ? data[0] : data;

    if (!result || typeof result.allowed !== "boolean") {
      console.error("[usage.ts] 예상치 못한 RPC 응답:", data);
      throw new Error("무료 사용 제한 확인 실패: 잘못된 응답 형식");
    }

    return {
      allowed: result.allowed,
      remaining: typeof result.remaining === "number" ? result.remaining : 0,
    };
  } catch (err) {
    console.error("[usage.ts] consumeFreeUsage 예외:", err);
    throw err;
  }
}
