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
    const selected = Array.from(new Set(rawCats.map((c) => normalizeCategory(c)).filter(Boolean))) as NormalizedCategory[];
    const targetCount = Number(sp.get("count") ?? "20") || 20;

    if (!grade || !subject || selected.length === 0) {
      return NextResponse.json(
        { ok: false, error: "Invalid params", grade, subject, rawCategories: rawCats },
        { status: 400 },
      );
    }

    // ✅ 선택 순서 고정 (vocab 우선)
    const fixedOrder: NormalizedCategory[] = ["vocab", "grammar", "dialogue", "reading"];
    const groupsInOrder = fixedOrder.filter(g => selected.includes(g));

    // ✅ 할당량 계산 (fixedOrder 순서대로 나머지 분배)
    const base = Math.floor(targetCount / groupsInOrder.length);
    const remainder = targetCount % groupsInOrder.length;
    const desired: Record<string, number> = {};
    for (let i = 0; i < groupsInOrder.length; i++) {
      desired[groupsInOrder[i]] = base + (i < remainder ? 1 : 0);
    }

    // ✅ qtype 헬퍼
    function getQtype(row: any): string {
      return String(
        row?.qtype ??
        row?.content?.qtype ??
        row?.content?.raw?.qtype ??
        row?.content?.meta?.qtype ??
        row?.content?.data?.qtype ??
        row?.content?.question?.qtype ??
        ""
      ).trim();
    }

    // ✅ 그룹별 풀 가져오기
    const byGroup: Record<string, any[]> = {};
    const debugCounts: Record<string, { exact: number; fallback: number }> = {};

    // vocab/dialogue는 category로 직접 조회
    for (const g of groupsInOrder) {
      if (g === "vocab" || g === "dialogue") {
        const poolLimit = Math.max(desired[g] * 10, 40);
        const { data, error } = await supabase
          .from("problems")
          .select("id, grade, subject, category, difficulty, content, content_hash, created_at")
          .eq("grade", grade)
          .eq("subject", subject)
          .eq("category", g)
          .limit(poolLimit);

        if (error) {
          console.error(`❌ Supabase 쿼리 에러 (${g}):`, error);
          return NextResponse.json(
            { ok: false, error: "db_error", errorMessage: error?.message ?? "" },
            { status: 500 },
          );
        }
        byGroup[g] = data ?? [];
        debugCounts[g] = { exact: (data ?? []).length, fallback: 0 };
      }
    }

    // grammar는 fallback 지원: category="grammar" 먼저, 0개면 qtype="문법_%"
    if (groupsInOrder.includes("grammar")) {
      const grammarLimit = Math.max((desired["grammar"] || 0) * 10, 40);

      // (A) category="grammar"로 먼저 조회
      const { data: exactGrammar, error: exactError } = await supabase
        .from("problems")
        .select("id, grade, subject, category, difficulty, content, content_hash, created_at")
        .eq("grade", grade)
        .eq("subject", subject)
        .eq("category", "grammar")
        .limit(grammarLimit);

      if (exactError) {
        console.error(`❌ Supabase 쿼리 에러 (grammar exact):`, exactError);
        return NextResponse.json(
          { ok: false, error: "db_error", errorMessage: exactError?.message ?? "" },
          { status: 500 },
        );
      }

      const exactRows = exactGrammar ?? [];
      debugCounts["grammar"] = { exact: exactRows.length, fallback: 0 };

      // (B) 0개면 fallback: qtype LIKE '문법_%'
      if (exactRows.length === 0) {
        console.warn(`[student/random] category=grammar 0개, fallback to qtype='문법_%'`);

        const { data: allRows, error: fallbackError } = await supabase
          .from("problems")
          .select("id, grade, subject, category, difficulty, content, content_hash, created_at")
          .eq("grade", grade)
          .eq("subject", subject)
          .limit(grammarLimit * 2);

        if (fallbackError) {
          console.error(`❌ Supabase 쿼리 에러 (grammar fallback):`, fallbackError);
          return NextResponse.json(
            { ok: false, error: "db_error", errorMessage: fallbackError?.message ?? "" },
            { status: 500 },
          );
        }

        const fallbackRows = (allRows ?? []).filter((row: any) => getQtype(row).startsWith("문법_"));
        byGroup["grammar"] = fallbackRows;
        debugCounts["grammar"].fallback = fallbackRows.length;
        console.log(`[student/random] grammar fallback 결과: ${fallbackRows.length}개`);
      } else {
        byGroup["grammar"] = exactRows;
      }
    }

    // reading은 category="reading"에서 qtype으로 분리
    if (groupsInOrder.includes("reading")) {
      const readingLimit = Math.max((desired["reading"] || 0) * 10, 80);
      const { data, error } = await supabase
        .from("problems")
        .select("id, grade, subject, category, difficulty, content, content_hash, created_at")
        .eq("grade", grade)
        .eq("subject", subject)
        .eq("category", "reading")
        .limit(readingLimit);

      if (error) {
        console.error(`❌ Supabase 쿼리 에러 (reading):`, error);
        return NextResponse.json(
          { ok: false, error: "db_error", errorMessage: error?.message ?? "" },
          { status: 500 },
        );
      }

      const readingRows = data ?? [];
      const readingFiltered = readingRows.filter((row: any) => getQtype(row).startsWith("본문_"));
      byGroup["reading"] = readingFiltered;
      debugCounts["reading"] = { exact: readingFiltered.length, fallback: 0 };
      console.log(`[student/random] reading 필터 결과: ${readingFiltered.length}개`);
    }

    // ✅ 그룹별로 정확히 desired[g]개 선택
    const groupPicks: Record<string, any[]> = {};
    for (const g of groupsInOrder) {
      const pool = byGroup[g] ?? [];
      const need = desired[g] || 0;

      if (g === "grammar") {
        const byQtype: Record<string, any[]> = {};
        for (const row of pool) {
          const qtype = getQtype(row);
          if (!byQtype[qtype]) byQtype[qtype] = [];
          byQtype[qtype].push(row);
        }
        const qtypes = Object.keys(byQtype);
        const picks: any[] = [];
        let qtypeIdx = 0;
        while (picks.length < need && picks.length < pool.length) {
          const qtype = qtypes[qtypeIdx % qtypes.length];
          const arr = byQtype[qtype];
          if (arr && arr.length > 0) {
            const idx = picks.filter(p => getQtype(p) === qtype).length;
            if (idx < arr.length) {
              picks.push(arr[idx]);
            }
          }
          qtypeIdx++;
        }
        groupPicks[g] = picks;
      } else {
        groupPicks[g] = shuffle(pool).slice(0, need);
      }
    }

    // ✅ 순서대로 결합: vocab + grammar + dialogue + reading (글로벌 셔플 금지)
    let finalRows: any[] = [];
    for (const g of fixedOrder) {
      if (groupsInOrder.includes(g)) {
        finalRows.push(...(groupPicks[g] ?? []));
      }
    }

    // ✅ 부족하면 추가 (fixedOrder 순서대로 우선)
    if (finalRows.length < targetCount) {
      const seen = new Set(finalRows.map((p) => p.id));
      for (const g of fixedOrder) {
        if (!groupsInOrder.includes(g)) continue;
        const pool = byGroup[g] ?? [];
        for (const row of pool) {
          if (finalRows.length >= targetCount) break;
          if (!seen.has(row.id)) {
            seen.add(row.id);
            finalRows.push(row);
          }
        }
        if (finalRows.length >= targetCount) break;
      }
    }

    const rows = finalRows.slice(0, targetCount);

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
      let countVocab = 0, countGrammar = 0, countDialogue = 0, countReading = 0;
      for (const p of mapped) {
        if (!p) continue;
        const cat = normalizeCategory(p.category);
        const qtype = getQtype(p);
        if (cat === "vocab") countVocab++;
        else if (cat === "dialogue") countDialogue++;
        else if (cat === "reading" && qtype.startsWith("문법_")) countGrammar++;
        else if (cat === "reading" && qtype.startsWith("본문_")) countReading++;
      }
      console.log("[student/random] finalCounts", {
        vocab: countVocab,
        grammar: countGrammar,
        dialogue: countDialogue,
        reading: countReading,
        total: mapped.length
      });
    }

    // 요청된 문제가 0개이면 상세 에러 반환
    if (mapped.length === 0) {
      const debugInfo: any = {
        requested: { grade, subject, categories: selected, targetCount },
        poolSizes: {},
        rawPoolSizes: {},
        hint: "",
        solution: "",
      };

      for (const g of groupsInOrder) {
        const poolSize = (byGroup[g] || []).length;
        debugInfo.poolSizes[g] = poolSize;

        // 원본 조회 결과도 기록
        if (g === "grammar" || g === "reading") {
          const readingRows = byGroup[g] || [];
          const qtypes = readingRows.slice(0, 10).map((r: any) => getQtype(r));
          debugInfo.rawPoolSizes[g] = {
            count: poolSize,
            sampleQtypes: qtypes,
          };
        }
      }

      if (selected.includes("grammar") && (byGroup["grammar"] || []).length === 0) {
        debugInfo.hint =
          "DB에 문법 문제가 없습니다. " +
          "문법 문제는 category='reading'에서 qtype='문법_'로 시작하는 것들입니다.";
        debugInfo.solution =
          `1. /api/debug/problems?grade=${grade}&subject=${subject}&category=grammar 에서 DB 상태 확인\n` +
          `2. DB에 category='reading'이고 qtype='문법_XXX' 형태의 데이터를 추가하거나\n` +
          `3. 기존 문법 문제의 qtype을 '문법_'로 시작하도록 수정`;
      } else {
        const missingCats = groupsInOrder.filter(g => (byGroup[g] || []).length === 0);
        debugInfo.hint = `선택한 카테고리 중 ${missingCats.join(", ")}에 문제가 없습니다.`;
        debugInfo.solution = "해당 카테고리의 문제를 DB에 추가해야 합니다.";
      }

      console.error("[student/random] 문제 0개 반환:", debugInfo);
      return NextResponse.json({
        ok: false,
        error: "no_problems",
        errorMessage: debugInfo.hint + "\n\n" + debugInfo.solution,
        errorDetails: debugInfo,
      }, { status: 200 });
    }

    if (mapped.length < targetCount) {
      console.warn(`[student/random] 목표 ${targetCount}개 중 ${mapped.length}개만 반환`);
    }

    // 개발 환경에서 debug 필드 추가
    const response: any = { ok: true, problems: mapped, total: mapped.length };
    if (process.env.NODE_ENV === "development") {
      response.debug = {
        counts: debugCounts,
        requested: { grade, subject, categories: selected, targetCount },
      };
    }

    return NextResponse.json(response);
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

