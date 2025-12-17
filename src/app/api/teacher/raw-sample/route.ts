import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

/**
 * 디버깅 전용: problems 테이블에서 1개 샘플을 가져와 raw 구조를 확인
 */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const grade = searchParams.get("grade") ?? "2";
    const subject = searchParams.get("subject") ?? "english";

    const { data, error } = await supabase
      .from("problems")
      .select("id, category, content, created_at")
      .eq("grade", grade)
      .eq("subject", subject)
      .limit(1)
      .single();

    if (error) {
      return NextResponse.json(
        { error: { message: error.message } },
        { status: 500 }
      );
    }

    if (!data) {
      return NextResponse.json(
        { error: { message: "데이터 없음" } },
        { status: 404 }
      );
    }

    const content = data.content ?? {};
    const raw = content?.raw ?? content;

    return NextResponse.json({
      id: data.id,
      category: data.category,
      contentKeys: Object.keys(content),
      rawKeys: Object.keys(raw),
      hasChoices1to5: ["보기1", "보기2", "보기3", "보기4", "보기5"].some(k => raw?.[k] != null),
      hasChoicesArray: Array.isArray(raw?.choices) || Array.isArray(content?.choices),
      sampleRaw: {
        question: raw?.question ?? raw?.문제 ?? null,
        passage: raw?.passage ?? raw?.지문 ?? null,
        choices: raw?.choices ?? raw?.보기 ?? null,
        보기1: raw?.보기1 ?? null,
        보기2: raw?.보기2 ?? null,
      },
    });
  } catch (err) {
    return NextResponse.json(
      {
        error: {
          message: err instanceof Error ? err.message : String(err),
        },
      },
      { status: 500 }
    );
  }
}

