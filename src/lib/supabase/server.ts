import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

/**
 * 서버 컴포넌트/API에서 사용하는 Supabase 클라이언트
 * SSR 세션 쿠키를 자동으로 관리합니다.
 */
export function createSupabaseServer() {
  const cookieStore = cookies();

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

// 하위 호환성을 위한 별칭
export const supabaseServer = createSupabaseServer;
