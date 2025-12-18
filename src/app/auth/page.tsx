"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import AuthForm from "@/components/AuthForm";
import { createClient } from "@supabase/supabase-js";

export default function AuthPage() {
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    supabase.auth.getSession().then(({ data }) => {
      if (data.session) router.replace("/");
    });
  }, [router]);

  return (
    <div className="min-h-screen flex items-start justify-center bg-slate-50 px-4 py-10">
      <div className="w-full max-w-md">
        <AuthForm />
      </div>
    </div>
  );
}
