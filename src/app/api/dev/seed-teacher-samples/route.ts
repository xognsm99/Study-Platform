// src/app/api/dev/seed-teacher-samples/route.ts

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

// 데이터 파일들
import { DIALOGUE_BLANK_QUESTION_SAMPLES } from "@/data/dialogue_blank_question_samples";
import { VOCAB_DEFINITION_MATCH_SAMPLES } from "@/data/vocab_definition_match_samples";
import { READING_TITLE_DIEGO_SAMPLES } from "@/data/reading_title_diego_samples";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  throw new Error("Supabase env vars are missing");
}

const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

function generateContentHash(sample: any): string {
  // 샘플의 id를 기반으로 unique hash 생성
  // 또는 category-id 조합으로 생성
  const base = `${sample.category}-${sample.id}`;
  return crypto.createHash("sha256").update(base).digest("hex").slice(0, 32);
}

function normalizeSample(sample: any) {
  const contentObj = sample.content || {};

  // question_type에 따라 content.type 결정
  let contentType = sample.question_type || "unknown";
  
  // content 필드 구성
  const content: any = {
    type: contentType,
    prompt: sample.prompt || "",
    question: contentObj.question || sample.prompt || "",
    choices: contentObj.choices || [],
    answerIndex: typeof sample.answer_index === "number" 
      ? sample.answer_index - 1  // 1-based → 0-based
      : (contentObj.answerIndex ?? 0),
    explanation: sample.explanation || "",
  };

  // 타입별 추가 필드
  if (contentObj.dialogue) {
    content.dialogue = contentObj.dialogue;
  }
  if (contentObj.passage) {
    content.passage = contentObj.passage;
  }
  if (contentObj.definition_en) {
    content.definition_en = contentObj.definition_en;
    content.definition_ko = contentObj.definition_ko || "";
  }

  const result: any = {
    id: sample.id || crypto.randomUUID(),
    grade: String(sample.grade ?? "2"),
    subject: sample.subject ?? "english",
    category: sample.category, // "dialogue" | "vocab" | "reading"
    difficulty: String(sample.difficulty ?? "1"),
    content,
    content_hash: generateContentHash(sample),
    publisher: sample.publisher ?? "동아윤",
    // source 컬럼이 없으므로 제거
    explanation: sample.explanation || "",
  };
  
  return result;
}

export async function POST(_req: NextRequest) {
  try {
    // 1) teacher_sample 문제 삭제 (publisher="동아윤", grade="2", subject="english" 조건으로 삭제)
    // 또는 특정 id 패턴으로 삭제 (dlg-blankq-, vocab-def-, rd-title-diego-)
    console.log("[seed-teacher-samples] Deleting existing teacher_sample problems...");
    const { error: deleteError } = await supabaseAdmin
      .from("problems")
      .delete()
      .eq("publisher", "동아윤")
      .eq("grade", "2")
      .eq("subject", "english");

    if (deleteError) {
      console.error("[seed-teacher-samples] Delete error:", deleteError);
      // source 컬럼이 없을 수 있으므로 에러를 무시하고 계속 진행
      console.warn("[seed-teacher-samples] Delete failed, continuing with insert...");
    }

    // 2) 샘플 데이터 정규화
    const allSamples = [
      ...DIALOGUE_BLANK_QUESTION_SAMPLES,
      ...VOCAB_DEFINITION_MATCH_SAMPLES,
      ...READING_TITLE_DIEGO_SAMPLES,
    ];

    const normalized = allSamples.map(normalizeSample);

    // 3) DB에 insert
    console.log(`[seed-teacher-samples] Inserting ${normalized.length} problems...`);
    const { error: insertError } = await supabaseAdmin
      .from("problems")
      .insert(normalized);

    if (insertError) {
      console.error("[seed-teacher-samples] Insert error:", insertError);
      return NextResponse.json(
        { ok: false, stage: "insert", error: insertError.message },
        { status: 500 }
      );
    }

    // 4) 카테고리별 개수 계산
    const counts = normalized.reduce(
      (acc: any, row) => {
        acc[row.category] = (acc[row.category] || 0) + 1;
        acc.total += 1;
        return acc;
      },
      { dialogue: 0, vocab: 0, reading: 0, total: 0 }
    );

    return NextResponse.json({
      ok: true,
      inserted: {
        dialogue: counts.dialogue || 0,
        vocab: counts.vocab || 0,
        reading: counts.reading || 0,
        total: counts.total,
      },
    });
  } catch (err: any) {
    console.error("[seed-teacher-samples] Unknown error:", err);
    return NextResponse.json(
      { ok: false, stage: "unknown", error: String(err?.message ?? err) },
      { status: 500 }
    );
  }
}

export async function GET(_req: NextRequest) {
  return POST(_req);
}
