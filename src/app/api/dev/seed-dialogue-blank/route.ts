// src/app/api/dev/seed-dialogue-blank/route.ts
import { NextResponse } from "next/server";
import { createHash } from "crypto";
import { createClient } from "@supabase/supabase-js";

import { DIALOGUE_BLANK_QUESTION_SAMPLES } from "@/data/dialogue_blank_question_samples";

// Supabase Admin 클라이언트 생성
function createSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL 또는 SUPABASE_SERVICE_ROLE_KEY 환경 변수가 설정되지 않았습니다."
    );
  }

  return createClient(url, serviceKey);
}

// 브라우저에서 직접 GET으로도 호출할 수 있게 GET/POST 둘 다 지원
export async function GET() {
  return seedDialogueBlank();
}

export async function POST() {
  return seedDialogueBlank();
}

function hashContent(content: unknown) {
  return createHash("sha256")
    .update(JSON.stringify(content))
    .digest("hex");
}

async function seedDialogueBlank() {
  try {
    const supabase = createSupabaseAdmin();

    // 1) 기존 문제 전부 삭제 (원하면 주석 처리해도 됨)
    const { error: deleteError } = await supabase
      .from("problems")
      .delete()
      .neq("id", ""); // 조건 아무거나 하나 넣어서 delete 전체

    if (deleteError) {
      console.error("delete error", deleteError);
      return NextResponse.json(
        { ok: false, step: "delete", error: deleteError.message },
        { status: 500 }
      );
    }

    // 2) 샘플 배열을 problems 테이블 형태로 변환
    const rows = DIALOGUE_BLANK_QUESTION_SAMPLES.map((sample) => {
      const dialogueText = sample.content.dialogue
        .map((line) => `${line.speaker}: ${line.text}`)
        .join("\n");

      const question = `${dialogueText}\n\n${sample.prompt}`;

      const content = {
        type: "dialogue_blank",
        question, // 지문 + 질문
        choices: sample.content.choices,
        // 샘플은 1~5, 프론트는 0~4 쓰고 있으니까 -1
        answerIndex: sample.answer_index - 1,
        explanation: sample.explanation,
      };

      return {
        grade: String(sample.grade),
        subject: sample.subject,
        category: sample.category,
        difficulty: "medium",
        content,
        content_hash: hashContent(content),
      };
    });

    // 3) DB에 insert
    const { data: inserted, error: insertError } = await supabase
  .from("problems")
  .insert(rows)
  .select("id");

const count = inserted?.length ?? 0;


    if (insertError) {
      console.error("insert error", insertError);
      return NextResponse.json(
        { ok: false, step: "insert", error: insertError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      inserted: count ?? rows.length,
    });
  } catch (e: any) {
    console.error("seedDialogueBlank fatal", e);
    return NextResponse.json(
      { ok: false, step: "fatal", error: e?.message ?? String(e) },
      { status: 500 }
    );
  }
}

