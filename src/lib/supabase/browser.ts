import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * 브라우저에서 사용하는 Supabase 클라이언트
 * - @supabase/ssr 의 createBrowserClient 사용 (PKCE/code_challenge 포함)
 * - 싱글톤으로 재사용
 */
let browserClient: SupabaseClient | null = null;

export function createSupabaseBrowser(): SupabaseClient {
  if (!browserClient) {
    browserClient = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
  }
  return browserClient;
}

// 하위 호환성을 위한 별칭
export const supabaseBrowser = createSupabaseBrowser;
