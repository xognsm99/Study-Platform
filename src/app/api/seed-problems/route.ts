// src/app/api/seed-problems/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY 환경변수가 없습니다."
    );
  }

  return createClient(url, anonKey);
}

type ProblemInsert = {
  grade: string;
  subject: string;
  category: "dialogue" | "vocab" | "reading";
  difficulty: string;
  content: any;
  content_hash: string;
};

function chunk<T>(arr: T[], size: number): T[][] {
  const result: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    result.push(arr.slice(i, i + size));
  }
  return result;
}

// 🔹 모듈 안에서 "어떤 이름이든 상관없이" 첫 번째 배열을 찾아서 반환
function getFirstArrayFromModule(mod: any): any[] {
  if (!mod) return [];
  for (const value of Object.values(mod)) {
    if (Array.isArray(value) && value.length > 0) {
      return value as any[];
    }
  }
  return [];
}

/** ── 샘플 → DB row 매핑 ───────────────── */

function mapDialogueSample(sample: any, index: number): ProblemInsert {
  const question =
    sample.question ||
    sample.prompt ||
    sample.stem ||
    "대화문 문제 내용이 없습니다.";

  const choices =
    sample.choices ||
    sample.options ||
    sample.answers ||
    ["A", "B", "C", "D", "E"];

  const answerIndex =
    sample.answerIndex ??
    sample.correctIndex ??
    sample.correctAnswerIndex ??
    0;

  const explanation =
    sample.explanation ||
    sample.commentary ||
    sample.reason ||
    "해설이 없습니다.";

  const content = {
    type: "dialogue",
    question,
    choices,
    answerIndex,
    explanation,
    passage: sample.passage,
    sentences: sample.sentences,
  };

  return {
    grade: String(sample.grade ?? "2"),
    subject: String(sample.subject ?? "english"),
    category: "dialogue",
    difficulty: String(sample.difficulty ?? "medium"),
    content,
    content_hash: sample.id
      ? String(sample.id)
      : `dialogue-${index}-${Date.now()}`,
  };
}

function mapVocabSample(sample: any, index: number): ProblemInsert {
  const question =
    sample.question ||
    sample.prompt ||
    sample.definition ||
    "어휘 문제 내용이 없습니다.";

  const choices =
    sample.choices ||
    sample.options ||
    sample.words ||
    ["A", "B", "C", "D", "E"];

  const answerIndex =
    sample.answerIndex ??
    sample.correctIndex ??
    sample.correctAnswerIndex ??
    0;

  const explanation =
    sample.explanation ||
    sample.commentary ||
    sample.reason ||
    "해설이 없습니다.";

  const content = {
    type: "vocab",
    question,
    choices,
    answerIndex,
    explanation,
  };

  return {
    grade: String(sample.grade ?? "2"),
    subject: String(sample.subject ?? "english"),
    category: "vocab",
    difficulty: String(sample.difficulty ?? "medium"),
    content,
    content_hash: sample.id
      ? String(sample.id)
      : `vocab-${index}-${Date.now()}`,
  };
}

function mapReadingSample(sample: any, index: number): ProblemInsert {
  const question =
    sample.question ||
    sample.prompt ||
    "독해 문제 내용이 없습니다.";

  const choices =
    sample.choices ||
    sample.options ||
    ["A", "B", "C", "D", "E"];

  const answerIndex =
    sample.answerIndex ??
    sample.correctIndex ??
    sample.correctAnswerIndex ??
    0;

  const explanation =
    sample.explanation ||
    sample.commentary ||
    "해설이 없습니다.";

  const passage = sample.passage || sample.text || sample.body || "";

  const content = {
    type: "reading",
    question,
    choices,
    answerIndex,
    explanation,
    passage,
  };

  return {
    grade: String(sample.grade ?? "2"),
    subject: String(sample.subject ?? "english"),
    category: "reading",
    difficulty: String(sample.difficulty ?? "medium"),
    content,
    content_hash: sample.id
      ? String(sample.id)
      : `reading-${index}-${Date.now()}`,
  };
}

/** ── 메인 핸들러 ───────────────── */

export async function GET() {
  try {
    const supabase = getSupabase();

    // data 파일을 동적으로 불러오기
    const dialogueModule = (await import(
      "@/data/dialogue_flow_samples"
    )) as any;
    const vocabModule = (await import(
      "@/data/vocab_definition_match_samples"
    )) as any;
    const readingModule = (await import(
      "@/data/reading_title_diego_samples"
    )) as any;

    // 모듈 안의 첫 번째 배열을 자동으로 찾기
    const dialogues = getFirstArrayFromModule(dialogueModule);
    const vocabs = getFirstArrayFromModule(vocabModule);
    const readings = getFirstArrayFromModule(readingModule);

    console.log("[seed] dialogues:", dialogues.length);
    console.log("[seed] vocabs:", vocabs.length);
    console.log("[seed] readings:", readings.length);

    const all: ProblemInsert[] = [
      ...dialogues.map((s: any, i: number) => mapDialogueSample(s, i)),
      ...vocabs.map((s: any, i: number) => mapVocabSample(s, i)),
      ...readings.map((s: any, i: number) => mapReadingSample(s, i)),
    ];

    const filtered = all.filter(
      (p) =>
        p.content?.question &&
        typeof p.content.question === "string" &&
        p.content.question.length > 3
    );

    const summary = filtered.reduce(
      (acc, p) => {
        acc[p.category] = (acc[p.category] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    const batches = chunk(filtered, 100);
    const results: { batch: number; size: number; error: string | null }[] = [];

    for (const [i, part] of batches.entries()) {
      const { error } = await supabase.from("problems").insert(part);
      results.push({
        batch: i + 1,
        size: part.length,
        error: error ? error.message : null,
      });
      if (error) {
        console.error("Seed batch error", i + 1, error.message);
      }
    }

    return NextResponse.json({
      totalSamples: all.length,
      filteredSamples: filtered.length,
      insertedBatches: results,
      summary,
    });
  } catch (e: any) {
    console.error("seed-problems error", e);
    return NextResponse.json(
      { error: e?.message ?? "unknown error" },
      { status: 500 }
    );
  }
}
