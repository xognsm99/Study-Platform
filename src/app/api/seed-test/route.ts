// src/app/api/seed-test/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error("Supabase 환경변수(NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY)가 없습니다.");
  }

  return createClient(url, anonKey);
}

export async function GET() {
  try {
    const supabase = getSupabase();

    const content = {
      question: "seed-test 에서 넣은 테스트 문제입니다. 정답은 C 입니다.",
      choices: ["A", "B", "C", "D", "E"],
      answerIndex: 2,
      explanation: "테스트용 해설입니다.",
      type: "dialogue",
    };

    const { data, error } = await supabase
      .from("problems")
      .insert({
        grade: "2",
        subject: "english",
        category: "dialogue",
        difficulty: "medium",
        content,
        content_hash: "seed-test-1",
      })
      .select();

    if (error) {
      return NextResponse.json(
        { ok: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      inserted: data?.length ?? 0,
    });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message ?? "unknown error" },
      { status: 500 }
    );
  }
}
