"use client";

import { useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/browser";

export default function AuthForm() {
  const supabase = supabaseBrowser();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handle() {
    setLoading(true);
    setMsg(null);

    try {
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;

        // profiles upsert
        if (data.user) {
          await supabase.from("profiles").upsert({
            id: data.user.id,
            email: data.user.email,
            role: "student",
            subscription_status: "free",
          });
        }
        setMsg("가입 완료! 로그인해 주세요.");
        setMode("signin");
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        setMsg("로그인 성공!");
      }
    } catch (e: any) {
      setMsg(e.message ?? "오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-sm rounded-2xl border bg-white p-6 shadow-sm">
      <h1 className="mb-4 text-xl font-semibold">
        {mode === "signin" ? "로그인" : "회원가입"}
      </h1>

      <label className="block text-sm">이메일</label>
      <input
        className="mb-3 w-full rounded-md border px-3 py-2"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="you@example.com"
      />

      <label className="block text-sm">비밀번호</label>
      <input
        type="password"
        className="mb-4 w-full rounded-md border px-3 py-2"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="8자 이상 권장"
      />

      <button
        onClick={handle}
        disabled={loading}
        className="w-full rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? "처리 중..." : mode === "signin" ? "로그인" : "가입하기"}
      </button>

      <div className="mt-3 flex justify-between text-xs">
        <button
          className="underline"
          onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
        >
          {mode === "signin" ? "회원가입으로" : "로그인으로"}
        </button>
      </div>

      {msg && <p className="mt-3 text-sm text-gray-600">{msg}</p>}
    </div>
  );
}
