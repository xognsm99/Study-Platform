import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

// qtype 추출 헬퍼
function getQtype(row: any): string {
  return String(
    row?.qtype ??
    row?.content?.qtype ??
    row?.content?.raw?.qtype ??
    row?.content?.meta?.qtype ??
    row?.content?.data?.qtype ??
    ""
  ).trim();
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const grade = url.searchParams.get("grade") || "2";
  const subject = url.searchParams.get("subject") || "english";
  const category = url.searchParams.get("category") || "";

  const envUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const result: any = {
    grade,
    subject,
    category,
    envSupabaseUrl: envUrl.substring(0, 30) + "...",
    counts: {
      exactCategoryCount: null,
      qtypeGrammarCount: null,
    },
    distinct: {
      categories: [],
      subjects: [],
      grades: [],
    },
    samples: [],
    hint: "",
    errors: {},
  };

  // Supabase 클라이언트 생성
  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    result.errors.missingEnv = "SUPABASE_URL 또는 SUPABASE_SERVICE_ROLE_KEY가 설정되지 않았습니다.";
    result.hint = "환경변수 누락";
    return NextResponse.json(result, { status: 200 });
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { persistSession: false },
  });

  // 1) exactCategoryCount: category로 직접 조회
  if (category) {
    const { count: exactCount, error: exactError } = await supabase
      .from("problems")
      .select("id", { count: "exact", head: true })
      .eq("grade", grade)
      .eq("subject", subject)
      .eq("category", category);

    result.counts.exactCategoryCount = exactCount ?? 0;
    if (exactError) {
      result.errors.exactCategory = exactError.message;
    }
  }

  // 2) qtypeGrammarCount: qtype LIKE '문법_%'로 조회
  const { data: grammarRows, error: grammarError } = await supabase
    .from("problems")
    .select("id, category, content")
    .eq("grade", grade)
    .eq("subject", subject);

  if (grammarError) {
    result.errors.grammarQtype = grammarError.message;
  } else {
    const grammarCount = (grammarRows || []).filter((r: any) => {
      const qtype = getQtype(r);
      return qtype.startsWith("문법_");
    }).length;
    result.counts.qtypeGrammarCount = grammarCount;
  }

  // 3) distinct categories (grade/subject 범위 내)
  const { data: allInRange, error: allError } = await supabase
    .from("problems")
    .select("id, grade, subject, category, content, created_at")
    .eq("grade", grade)
    .eq("subject", subject)
    .order("created_at", { ascending: false })
    .limit(200);

  if (allError) {
    result.errors.all = allError.message;
  } else {
    const catMap: Record<string, number> = {};
    const subjMap: Record<string, number> = {};
    const gradeMap: Record<string, number> = {};

    for (const row of allInRange || []) {
      const cat = String(row.category || "").trim();
      const subj = String(row.subject || "").trim();
      const g = String(row.grade || "").trim();

      catMap[cat] = (catMap[cat] || 0) + 1;
      subjMap[subj] = (subjMap[subj] || 0) + 1;
      gradeMap[g] = (gradeMap[g] || 0) + 1;
    }

    result.distinct.categories = Object.entries(catMap).map(([k, v]) => ({ value: k, count: v }));
    result.distinct.subjects = Object.entries(subjMap).map(([k, v]) => ({ value: k, count: v }));
    result.distinct.grades = Object.entries(gradeMap).map(([k, v]) => ({ value: k, count: v }));
  }

  // 4) samples: 최근 20개
  const { data: sampleRows, error: sampleError } = await supabase
    .from("problems")
    .select("id, grade, subject, category, content, created_at")
    .eq("grade", grade)
    .eq("subject", subject)
    .order("created_at", { ascending: false })
    .limit(20);

  if (sampleError) {
    result.errors.samples = sampleError.message;
  } else {
    result.samples = (sampleRows || []).map((s: any) => ({
      id: s.id,
      grade: s.grade,
      subject: s.subject,
      category: s.category,
      qtype: getQtype(s),
      created_at: s.created_at,
    }));
  }

  // 5) hint 생성
  if (category === "grammar") {
    const exactCount = result.counts.exactCategoryCount || 0;
    const qtypeCount = result.counts.qtypeGrammarCount || 0;

    if (exactCount === 0 && qtypeCount > 0) {
      result.hint =
        `문법 데이터가 category=grammar가 아니라 다른 category에 있고 qtype이 문법_%로 들어가 있음. ` +
        `exactCategoryCount=${exactCount}, qtypeGrammarCount=${qtypeCount}`;
    } else if (exactCount === 0 && qtypeCount === 0) {
      result.hint = "DB에 문법 문제가 전혀 없습니다.";
    } else if (exactCount > 0) {
      result.hint = `category=grammar로 ${exactCount}개 존재.`;
    }
  }

  return NextResponse.json(result, { status: 200 });
}

