"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase-browser";

export default function AuthCallbackPage() {
  const router = useRouter();
  const ranRef = useRef(false); // ✅ dev에서 effect 2번 실행 방지

  useEffect(() => {
    if (ranRef.current) return;
    ranRef.current = true;

    const run = async () => {
      const params = new URLSearchParams(window.location.search);
      const code = params.get("code");

      if (code) {
        const authAny: any = supabaseBrowser.auth;

        // ✅ v2 PKCE
        if (typeof authAny.exchangeCodeForSession === "function") {
          const { error } = await authAny.exchangeCodeForSession(code);
          if (error) console.error("exchangeCodeForSession error:", error);
        }
        // ✅ v1 호환(혹시 남아있을 때)
        else if (typeof authAny.getSessionFromUrl === "function") {
          const { error } = await authAny.getSessionFromUrl({ storeSession: true });
          if (error) console.error("getSessionFromUrl error:", error);
        }
      }

      router.replace("/"); // 홈
    };

    run();
  }, [router]);

  return null;
}
