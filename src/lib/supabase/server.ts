import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

/**
 * 서버 컴포넌트/API에서 사용하는 Supabase 클라이언트
 * SSR 세션 쿠키를 자동으로 관리합니다.
 *
 * ✅ 호환 버전:
 * - createSupabaseServerAsync(): 정석(await cookies())
 * - createSupabaseServer(): 기존 코드 호환용(내부에서 즉시 Promise 반환)
 */
export async function createSupabaseServerAsync() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // Server Component에서는 쿠키 set이 제한될 수 있어 안전하게 무시
          }
        },
      },
    }
  );
}

/**
 * ✅ 기존 코드가 await 없이 호출해도 "일단" 안 깨지게 하기 위한 래퍼
 * - 반환값은 Promise(=thenable)라서, 기존 코드가 await 하는 곳은 그대로 동작
 */
export function createSupabaseServer() {
  return createSupabaseServerAsync();
}

// 하위 호환성: 기존 이름 유지
export const supabaseServer = createSupabaseServer;
