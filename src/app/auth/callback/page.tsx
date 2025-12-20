"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase-browser";

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

export default function AuthCallbackPage() {
  const router = useRouter();
  const ranRef = useRef(false);

  useEffect(() => {
    if (ranRef.current) return;
    ranRef.current = true;

    const run = async () => {
      const params = new URLSearchParams(window.location.search);
      const code = params.get("code");
      const next = params.get("next") || "/ko/student";

      const supabase = supabaseBrowser();

      if (code) {
        const authAny: any = supabase.auth;

        // PKCE 교환
        if (typeof authAny.exchangeCodeForSession === "function") {
          const { error } = await authAny.exchangeCodeForSession(code);
          if (error) {
            console.error("exchangeCodeForSession error:", error);
            router.replace(next);
            return;
          }
        } else if (typeof authAny.getSessionFromUrl === "function") {
          const { error } = await authAny.getSessionFromUrl({ storeSession: true });
          if (error) {
            console.error("getSessionFromUrl error:", error);
            router.replace(next);
            return;
          }
        }

        // ✅ 중요: 세션이 실제로 잡힐 때까지 잠깐 기다리기(최대 1.5초)
        for (let i = 0; i < 15; i++) {
          const { data } = await supabase.auth.getSession();
          if (data.session) break;
          await sleep(100);
        }
      }

      router.replace(next);
    };

    run();
  }, [router]);

  return null;
}
