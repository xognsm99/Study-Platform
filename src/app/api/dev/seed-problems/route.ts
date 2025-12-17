// src/app/api/dev/seed-problems/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

// 데이터 파일 import (named export 확인됨)
import { DIALOGUE_FLOW_SAMPLES } from "@/data/dialogue_flow_samples";
import { VOCAB_DEFINITION_MATCH_SAMPLES } from "@/data/vocab_definition_match_samples";
import { READING_TITLE_DIEGO_SAMPLES } from "@/data/reading_title_diego_samples";

// Supabase Admin 클라이언트 생성
function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL 또는 SUPABASE_SERVICE_ROLE_KEY 환경 변수가 설정되지 않았습니다."
    );
  }

  return createClient(url, serviceKey);
}

// DB Insert 타입 (컬럼 레벨)
type ProblemRow = {
  grade: string;
  subject: string;
  category: string;
  difficulty: string;
  content: any; // JSONB - 샘플 객체의 나머지 필드들이 모두 들어감
  content_hash: string;
};

// content_hash 생성 함수
// 형식: eng-2-dialogue-001
function generateContentHash(
  grade: string | number,
  subject: string,
  category: string,
  index: number | string
): string {
  const gradeStr = String(grade).replace(/\D/g, ""); // 숫자만 추출
  const subjectShort = subject === "english" ? "eng" : subject.slice(0, 3);
  const categoryShort =
    category === "dialogue"
      ? "dialogue"
      : category === "vocabulary"
      ? "vocab"
      : "reading";
  const indexStr = String(index).padStart(3, "0");

  return `${subjectShort}-${gradeStr}-${categoryShort}-${indexStr}`;
}

export async function GET() {
  try {
    console.log("[seed-problems] 시드 시작...");

    const supabaseAdmin = getSupabaseAdmin();

    // 1) 모든 샘플 데이터를 하나의 배열로 합치기
    const allSamples = [
      ...(DIALOGUE_FLOW_SAMPLES as any[]),
      ...(VOCAB_DEFINITION_MATCH_SAMPLES as any[]),
      ...(READING_TITLE_DIEGO_SAMPLES as any[]),
    ];

    console.log(`[seed-problems] 총 ${allSamples.length}개 샘플 로드됨`);

    // 2) 샘플 객체를 ProblemRow로 변환
    // grade, subject, category, difficulty, content_hash만 컬럼으로 빼고
    // 나머지는 모두 content에 포함 (content 필드 안의 내용도 평탄화)
    const rows: ProblemRow[] = allSamples.map((sample, idx) => {
      const sampleAny = sample as any;

      // 컬럼으로 사용할 필드 추출
      const grade = sampleAny.grade;
      const subject = sampleAny.subject;
      const category = sampleAny.category;
      const difficulty = sampleAny.difficulty;
      const content_hash = sampleAny.content_hash;

      // content로 넣을 필드들 수집 (grade, subject, category, difficulty, content_hash 제외)
      const contentFields: any = {};
      const excludeKeys = ["grade", "subject", "category", "difficulty", "content_hash"];

      for (const key in sampleAny) {
        if (!excludeKeys.includes(key)) {
          contentFields[key] = sampleAny[key];
        }
      }

      // content 필드 안의 내용을 평탄화
      const nestedContent = contentFields.content || {};
      const contentWithoutNested = { ...contentFields };
      delete contentWithoutNested.content;

      // content에는 type을 추가하고, nestedContent 내용을 평탄화하고, 나머지 필드도 포함
      const finalContent = {
        type: category || nestedContent.type || "unknown",
        ...nestedContent, // sentences, passage, definition_en 등이 최상위로
        ...contentWithoutNested, // id, question_type, prompt, answer_index, explanation 등
      };

      // content_hash가 없으면 생성
      const hashIndex = sampleAny.id ? String(sampleAny.id).match(/\d+$/)?.[0] : null;
      const finalHash =
        content_hash ||
        generateContentHash(
          grade || 2,
          subject || "english",
          category || finalContent.type,
          hashIndex || String(idx + 1)
        );

      return {
        grade: String(grade || "2"),
        subject: String(subject || "english"),
        category: String(category || finalContent.type),
        difficulty: String(difficulty || "medium"),
        content: finalContent,
        content_hash: finalHash,
      };
    });

    console.log(`[seed-problems] ${rows.length}개 문제로 변환 완료`);

    // 3) 기존 문제 모두 삭제
    console.log("[seed-problems] 기존 문제 삭제 중...");
    const { error: delErr } = await supabaseAdmin
      .from("problems")
      .delete()
      .neq("id", "");

    if (delErr) {
      console.error("[seed-problems] 삭제 오류:", delErr);
      return NextResponse.json(
        {
          ok: false,
          step: "delete",
          error: delErr.message,
        },
        { status: 500 }
      );
    }

    console.log("[seed-problems] 기존 문제 삭제 완료");

    // 4) 새 문제들 insert
    console.log(`[seed-problems] ${rows.length}개 문제 insert 중...`);
    const { error: insertErr, count } = await supabaseAdmin
      .from("problems")
      .insert(rows)
      .select();

    if (insertErr) {
      console.error("[seed-problems] Insert 오류:", insertErr);
      return NextResponse.json(
        {
          ok: false,
          step: "insert",
          error: insertErr.message,
        },
        { status: 500 }
      );
    }

    console.log(`[seed-problems] Insert 완료: ${count ?? rows.length}개`);

    // 5) 카테고리별 요약 정보 생성
    const summary = rows.reduce(
      (acc: any, r) => {
        acc.total += 1;
        acc[r.category] = (acc[r.category] || 0) + 1;
        return acc;
      },
      { total: 0 }
    );

    return NextResponse.json({
      ok: true,
      totalSamples: allSamples.length,
      inserted: count ?? rows.length,
      summary,
    });
  } catch (error: any) {
    console.error("[seed-problems] 치명적 오류:", error);
    return NextResponse.json(
      {
        ok: false,
        step: "unknown",
        error: error.message || "알 수 없는 오류가 발생했습니다.",
        stack: error.stack,
      },
      { status: 500 }
    );
  }
}
