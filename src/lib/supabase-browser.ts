// src/lib/supabase-browser.ts
import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

let _client: SupabaseClient | null = null;

export function supabaseBrowser(): SupabaseClient {
  if (_client) return _client;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  // ✅ @supabase/ssr의 createBrowserClient 사용 (PKCE code_verifier를 쿠키에 저장)
  // Supabase 대시보드 > Authentication > URL Configuration 에서
  // Redirect URLs에 반드시 추가: http://localhost:3000/auth/callback
  _client = createBrowserClient(url, anonKey);

  return _client;
}