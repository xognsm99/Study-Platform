import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// ✅ 브라우저에서 단 1개만 쓰는 클라이언트(중요)
export const supabaseBrowser = createClient(url, anonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false, // ✅ 우리는 callback 페이지에서 직접 처리
    storageKey: "study-platform-auth", // ✅ 고정(꼬임 방지)
  },
});

