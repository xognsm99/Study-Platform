import { NextResponse, NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

// 단순 셔플 유틸
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ✅ 카테고리 한/영 매핑 (조회용 확장)
const CATEGORY_KO_MAP: Record<string, string[]> = {
  vocab: ["vocab", "어휘"],
  reading: ["reading", "본문"],
  dialogue: ["dialogue", "대화문"],
  grammar: ["grammar", "문법"],
};

type NormalizedCategory = "vocab" | "reading" | "dialogue" | "grammar";

// ✅ grade 정규화: "중2", "중 2", "2학년" 등 → "2"
function normalizeGrade(input: string | null): string {
  const v = String(input ?? "").trim();
  if (!v) return "";
  const m = v.match(/(\d+)/);
  return m ? m[1] : v;
}

// ✅ subject 정규화: "영어" / "english" / "ENGLISH" -> "english"
function normalizeSubject(input: string | null): string {
  const v = String(input ?? "").trim().toLowerCase();
  if (!v) return "";
  if (v === "영어") return "english";
  return v;
}

// ✅ categories 파싱: JSON / CSV / 단일 값 모두 지원
function parseCategories(raw: string | null): string[] {
  if (!raw) return [];
  const v = raw.trim();

  // 1) JSON 배열/문자열 둘 다 허용
  try {
    const parsed = JSON.parse(v);
    if (Array.isArray(parsed)) {
      return parsed.map(String).map((x) => x.trim()).filter(Boolean);
    }
    if (typeof parsed === "string") {
      return [parsed.trim()].filter(Boolean);
    }
  } catch {
    // JSON 파싱 실패는 무시하고 CSV로 처리
  }

  // 2) CSV 허용: "grammar,reading"
  return v
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean);
}

// ✅ category 정규화 (한/영 → 표준 코드)
function normalizeCategory(input: string | null | undefined): NormalizedCategory | "" {
  const v = String(input ?? "").trim().toLowerCase();
  if (!v) return "";
  if (v === "어휘") return "vocab";
  if (v === "본문") return "reading";
  if (v === "대화문") return "dialogue";
  if (v === "문법") return "grammar";
  if (v === "vocab" || v === "reading" || v === "dialogue" || v === "grammar") return v as NormalizedCategory;
  return "";
}

// ✅ 조회용 카테고리 확장 (예: "grammar" → ["grammar","문법"])
function expandCategories(normalized: NormalizedCategory[]): string[] {
  const out = new Set<string>();
  for (const c of normalized) {
    const key = normalizeCategory(c);
    if (!key) continue;
    for (const v of CATEGORY_KO_MAP[key]) out.add(v);
  }
  return Array.from(out);
}

async function handleStudentRandom(req: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      return NextResponse.json(
        { ok: false, error: "NEXT_PUBLIC_SUPABASE_URL 또는 NEXT_PUBLIC_SUPABASE_ANON_KEY가 설정되지 않았습니다." },
        { status: 500 },
      );
    }

    // 개발 환경에서 현재 바라보는 Supabase 호스트를 로그로 출력
    if (process.env.NODE_ENV === "development") {
      try {
        const host = new URL(supabaseUrl).hostname;
        console.log("[student/random] supabase_host", host);
      } catch {
        // URL 파싱 실패 시는 무시
      }
    }

    // ✅ 단순 클라이언트 생성 (cookieStore 에러 방지)
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    const sp = req.nextUrl.searchParams;

    const grade = normalizeGrade(sp.get("grade"));
    const subject = normalizeSubject(sp.get("subject"));

    // categories 파싱 및 정규화
    const rawCats = parseCategories(sp.get("categories"));
    const normalizedCats = rawCats
      .map((c) => normalizeCategory(c))
      .filter(Boolean) as NormalizedCategory[];

    const expandedCats = expandCategories(normalizedCats);

    const targetCount = Number(sp.get("count") ?? "20") || 20;

    if (!grade || !subject || expandedCats.length === 0) {
      return NextResponse.json(
        { ok: false, error: "Invalid params", grade, subject, rawCategories: rawCats },
        { status: 400 },
      );
    }

    // ✅ DB에서 “선택된 카테고리만” 넉넉히 가져오기
    const fetchLimit = Math.max(200, targetCount * 20);

    let query = supabase
      .from("problems")
      .select("id, grade, subject, category, difficulty, content, content_hash, created_at", { count: "exact" })
      .eq("grade", grade)      // 정규화된 grade만 사용 (예: "2")
      .eq("subject", subject)  // 정규화된 subject만 사용 (예: "english")
      .in("category", expandedCats);

    const { data, error, count } = await query;

    // ✅ Supabase에서 가져온 row 개수 디버그 (개발환경 한정)
    if (process.env.NODE_ENV === "development") {
      console.log("[student/random] dbCount", data?.length ?? 0);
    }

    if (process.env.NODE_ENV === "development") {
      console.log("[student/random] normalized", {
        grade,
        subject,
        rawCategories: rawCats,
        normalizedCategories: normalizedCats,
        categoriesToQuery: expandedCats,
        dbCount: data?.length ?? 0,
      });
    }

    if (error || !data) {
      console.error("❌ Supabase 쿼리 에러:", error);
      return NextResponse.json(
        { ok: false, error: "db_error", errorMessage: error?.message ?? "", errorDetails: JSON.stringify(error, null, 2) },
        { status: 500 },
      );
    }

    // ✅ 카테고리별로 모으기 (row.category도 normalize 해서 매칭)
    const byCat: Record<string, any[]> = {};
    for (const c of normalizedCats) byCat[c] = [];

    for (const row of data) {
      const catNorm = normalizeCategory(row.category);
      if (catNorm && byCat[catNorm]) {
        byCat[catNorm].push(row);
      }
    }

    // ✅ 선택된 카테고리들끼리 targetCount를 균등 분배 (나머지는 앞에서부터 +1)
    const per = Math.floor(targetCount / (normalizedCats.length || 1));
    let rem = targetCount % (normalizedCats.length || 1);
    let picked: any[] = [];

    for (const c of normalizedCats) {
      const need = per + (rem > 0 ? 1 : 0);
      if (rem > 0) rem--;
      const pool = shuffle(byCat[c] ?? []);
      picked.push(...pool.slice(0, need));
    }

    // ✅ 부족하면 선택된 카테고리 범위 안에서만 추가로 채우기
      if (picked.length < targetCount) {
      const pool = shuffle(normalizedCats.flatMap((c) => byCat[c] ?? []));
      const seen = new Set(picked.map((p) => p.id));
      for (const row of pool) {
        if (picked.length >= targetCount) break;
        if (!seen.has(row.id)) {
          seen.add(row.id);
          picked.push(row);
        }
      }
    }

    const rows = picked;

    // QuizClient가 기대하는 형태로 변환 (5지선다 표준화)
    const mapped = rows
      .map((row: any) => {
        const content = row?.content ?? {};
        const raw = content?.raw ?? {};

        // question: content.question -> raw["문제"] -> raw.question ...
        const question = String(
          content.question ??
          raw["문제"] ??
          raw.question ??
          raw["문항"] ??
          raw["질문"] ??
          raw["문장"] ??
          raw["지문"] ??
          ""
        ).trim();

        const categoryLower = String(row.category ?? "").trim().toLowerCase();
        const isGrammar = categoryLower === "grammar" || categoryLower.includes("문법");

        // 문법 이외: 질문이 너무 짧으면 버림, 문법은 한 문장이라도 살림
        if (!question || (!isGrammar && question.length < 5)) return null;

        // choices: content.choices 우선, 없으면 raw 보기1~5
        let choices: string[] = [];
        if (Array.isArray(content.choices) && content.choices.length === 5) {
          choices = content.choices.map((c: any) => String(c).trim());
        } else if (Array.isArray(raw.options) && raw.options.length === 5) {
          choices = raw.options.map((c: any) => String(c).trim());
        } else if (Array.isArray(raw.choices) && raw.choices.length === 5) {
          choices = raw.choices.map((c: any) => String(c).trim());
        } else {
          choices = [
            String(raw["보기1"] ?? raw.choice1 ?? "").trim(),
            String(raw["보기2"] ?? raw.choice2 ?? "").trim(),
            String(raw["보기3"] ?? raw.choice3 ?? "").trim(),
            String(raw["보기4"] ?? raw.choice4 ?? "").trim(),
            String(raw["보기5"] ?? raw.choice5 ?? "").trim(),
          ];
        }

        // answerIndex: raw["정답번호"] → content.answerIndex → raw.answerIndex ...
        let answerNo: number | null = null;
        if (typeof raw["정답번호"] === "number") answerNo = raw["정답번호"];
        else if (typeof raw.정답번호 === "number") answerNo = raw.정답번호;
        else if (typeof raw.answerNumber === "number") answerNo = raw.answerNumber;
        else if (typeof raw["정답번호"] === "string") {
          const parsed = parseInt(raw["정답번호"], 10);
          if (!isNaN(parsed)) answerNo = parsed;
        } else if (typeof content.answerIndex === "number") {
          answerNo = content.answerIndex + 1;
        } else if (typeof content.answerNumber === "number") {
          answerNo = content.answerNumber;
        } else if (typeof raw.answerIndex === "number") {
          answerNo = raw.answerIndex + 1;
        }

        const hasValidChoices = choices.length === 5 && choices.every((ch) => ch && ch.length > 0);
        const hasValidAnswer = answerNo !== null && answerNo >= 1 && answerNo <= 5;

        // 문법 이외: 보기/정답이 없으면 버림
        // 문법: 보기/정답이 없어도 practiceMode로 살림
        let isPracticeMode = false;
        if (!isGrammar && (!hasValidChoices || !hasValidAnswer)) return null;
        if (isGrammar && (!hasValidChoices || !hasValidAnswer)) {
          isPracticeMode = true;
          // 문법에서 보기/정답이 없으면 임시 보기/정답 생성
          if (!hasValidChoices) {
            choices = ["1", "2", "3", "4", "5"];
          }
          if (!hasValidAnswer) {
            answerNo = 1;
          }
        }

        const answerIndex = (answerNo ?? 1) - 1;

        // explanation: content.explanation -> raw["해설"] -> raw["비고"] -> raw["메모"]
        const explanation = String(
          content.explanation ??
          raw["해설"] ??
          raw["비고"] ??
          raw["메모"] ??
          ""
        ).trim();

        let type: "dialogue" | "vocab" | "reading" | "grammar" = "reading";
        if (categoryLower.includes("dialog")) type = "dialogue";
        else if (categoryLower.includes("vocab") || categoryLower.includes("word") || categoryLower.includes("어휘")) type = "vocab";
        else if (isGrammar) type = "grammar";

        return {
          id: row.id,
          question,
          choices,
          answerIndex,
          explanation,
          category: row.category,          // ✅ 항상 포함
          categories: [row.category],      // ✅ 항상 단일 카테고리 배열 포함
          difficulty: row.difficulty || "medium",
          type,
          passage: raw.passage ? String(raw.passage) : undefined,
          content: row.content,
          isPracticeMode,
        };
      })
      .filter((p: any) => p !== null); // null 제거

    // ✅ 변환 후 개수 디버그 (개발환경 한정)
    if (process.env.NODE_ENV === "development") {
      console.log("[student/random] returnedCount", mapped.length);
      if ((mapped.length === 0) && data && data.length > 0) {
        console.log(
          "[student/random] sampleRawKeys",
          Object.keys((data?.[0]?.content?.raw ?? {}) as Record<string, any>),
        );
      }
    }

    return NextResponse.json({ ok: true, problems: mapped, total: count ?? mapped.length });
  } catch (e: any) {
    console.error("student/random error:", e);
    return NextResponse.json(
      { ok: false, error: e?.message ?? "Internal Server Error" },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  return handleStudentRandom(req);
}

export async function GET(req: NextRequest) {
  return handleStudentRandom(req);
}

