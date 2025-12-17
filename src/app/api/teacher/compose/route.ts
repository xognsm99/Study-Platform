import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { type PresetKey } from "@/lib/teacher-presets";
import { buildExamPlan } from "@/lib/teacher/buildExamPlan";
import type { CategoryCounts } from "@/lib/teacher-presets";
import { normalizeTeacherCategory, normalizeQtype } from "@/lib/teacher/normalize";

export const runtime = "nodejs";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

const QT = {
  VOCAB_DICT: "어휘_사전",
  VOCAB_ENG: "어휘_영영",
  GRAM_ERR: "문법_어법오류",
  GRAM_BLANK: "문법_빈칸",
  READ_TITLE: "본문_제목",
  READ_Q: "본문_물음",
  DIA_BLANK: "대화문_빈칸",
  DIA_FLOW: "대화문_흐름",
  // 확장(추후)
  VOCAB_CTX: "어휘_문맥",
  GRAM_ORDER: "문법_배열",
  READ_MATCH: "본문_일치",
  DIA_REPLY: "대화문_응답",
} as const;

const ALLOWED_QTYPES = new Set<string>([
  QT.VOCAB_DICT, QT.VOCAB_ENG, QT.VOCAB_CTX,
  QT.GRAM_ERR, QT.GRAM_BLANK, QT.GRAM_ORDER,
  QT.READ_TITLE, QT.READ_Q, QT.READ_MATCH,
  QT.DIA_BLANK, QT.DIA_FLOW, QT.DIA_REPLY,
]);

function shuffle<T>(arr: T[]) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function take<T>(arr: T[], n: number) {
  return arr.slice(0, n);
}

/**
 * 깊게 찾아서 첫 번째 긴 문자열을 잡는 안전한 폴백
 */
function deepFindText(v: any): string {
  if (!v) return "";
  
  if (typeof v === "string") {
    const s = v.trim();
    // 너무 짧은 건 제외
    return s.length >= 8 ? s : "";
  }
  
  if (Array.isArray(v)) {
    for (const it of v) {
      const found = deepFindText(it);
      if (found) return found;
    }
    return "";
  }
  
  if (typeof v === "object") {
    // explanation/해설만 먼저 잡히는 거 방지
    const skip = new Set(["explanation", "solution", "commentary"]);
    for (const k of Object.keys(v)) {
      if (skip.has(k)) continue;
      const found = deepFindText(v[k]);
      if (found) return found;
    }
  }
  
  return "";
}

/**
 * 선생님 전용 텍스트 추출 함수
 */
function extractTeacherText(row: any): string {
  const c = row?.content ?? {};
  const raw = c?.raw ?? c;

  const text =
    raw?.question ??
    raw?.stem ??
    raw?.text ??
    raw?.prompt ??
    raw?.sentence ??
    raw?.dialogue ??
    raw?.line ??
    raw?.cloze ??
    raw?.ask ??
    c?.question ??
    c?.stem ??
    c?.text ??
    c?.prompt ??
    "";

  // reading 계열은 지문(passage)만 있는 경우도 있으니 fallback
  const passage =
    raw?.passage ??
    raw?.reading ??
    raw?.article ??
    c?.passage ??
    c?.reading ??
    c?.article ??
    "";

  // 깊게 찾아서 첫 번째 긴 문자열을 잡는 안전한 폴백
  const fallback = deepFindText(raw) || deepFindText(c);

  return String(text || passage || fallback || "").trim();
}


/**
 * 선택지 추출 함수 (선생님 전용)
 */
function extractChoices(row: any): any[] {
  const c = row?.content ?? {};
  const raw = c?.raw ?? c;
  const choices = raw?.choices ?? raw?.options ?? c?.choices ?? c?.options ?? [];
  return Array.isArray(choices) ? choices : [];
}

/**
 * 정답 추출 함수 (선생님 전용)
 */
function extractAnswer(row: any) {
  const c = row?.content ?? {};
  const raw = c?.raw ?? c;
  return raw?.answer ?? raw?.correct ?? raw?.answerIndex ?? c?.answer ?? null;
}

/**
 * 해설 추출 함수 (선생님 전용)
 */
function extractExplanation(row: any): string {
  const c = row?.content ?? {};
  const raw = c?.raw ?? c;
  const exp = raw?.explanation ?? raw?.solution ?? c?.explanation ?? c?.solution ?? "";
  return String(exp || "").trim();
}

/**
 * category에서 기본 qtype을 유추하는 함수 (선생님 전용)
 * content.raw.qtype이 없을 때 사용
 */
function inferQtypeFromCategory(category?: string | null): string | null {
  if (!category) return null;

  const c = String(category).toLowerCase();

  // 너희 프로젝트 qtype 대표값으로 매핑 (일단 컴파일/동작 안정화 목적)
  if (c.includes("vocab") || c.includes("어휘")) return "어휘_사전";
  if (c.includes("dialog") || c.includes("대화")) return "대화문_빈칸";
  if (c.includes("grammar") || c.includes("문법")) return "문법_빈칸";
  if (c.includes("reading") || c.includes("본문") || c.includes("독해")) return "본문_물음";

  return null; // ✅ 모든 경로에서 return 보장 (이게 중요)
}

export async function POST(req: Request) {
  try {
    // 환경 변수 체크
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error("❌ [TEACHER/COMPOSE] Supabase 환경 변수 미설정");
      return NextResponse.json(
        { 
          error: {
            message: "Supabase 환경 변수가 설정되지 않았습니다.",
            detail: "SUPABASE_URL 또는 SUPABASE_SERVICE_ROLE_KEY가 설정되지 않았습니다.",
          },
        },
        { status: 500 }
      );
    }

    // 요청 본문 파싱
    let body: any = {};
    try {
      body = await req.json();
    } catch (parseError: any) {
      console.error("❌ [TEACHER/COMPOSE] JSON 파싱 실패:", parseError);
      return NextResponse.json(
        { 
          error: {
            message: "요청 본문 파싱 실패",
            detail: parseError?.message || "Invalid JSON",
          },
        },
        { status: 400 }
      );
    }

    // 요청 파라미터 추출: grade, subject, preset(or plan)
    const grade = body.grade ?? "2";
    const subject = body.subject ?? "english";
    
    // plan이 오면 그걸 그대로 사용, 없으면 preset에서 변환
    const plan = body.plan 
      ? {
          vocabulary: Number(body.plan.vocab ?? body.plan.vocabulary ?? 0),
          dialogue: Number(body.plan.dialogue ?? 0),
          grammar: Number(body.plan.grammar ?? 0),
          reading: Number(body.plan.reading ?? 0),
        }
      : buildExamPlan((body.preset ?? "balanced") as PresetKey);
    
    const total = Object.values(plan).reduce((a, b) => a + b, 0);
    console.log("[TEACHER/COMPOSE] plan:", plan, "total:", total);

    // 디버그 로그: API 호출 파라미터
    console.log("🔍 [TEACHER/COMPOSE] API 호출 파라미터:", { grade, subject, plan, total });

    // 필요한 qtype만 먼저 모은다 (현재 8개 기준)
    const neededQtypes = [
      QT.VOCAB_DICT, QT.VOCAB_ENG,
      QT.DIA_BLANK, QT.DIA_FLOW,
      QT.GRAM_ERR, QT.GRAM_BLANK,
      QT.READ_TITLE, QT.READ_Q,
    ];

    console.log("🔍 [TEACHER/COMPOSE] 필요한 qtype:", neededQtypes);
    console.log("🔍 [TEACHER/COMPOSE] Supabase 조회 조건:", { grade, subject, neededQtypes });

    // ✅ jsonb 경로 필터: content->raw->>qtype
    const { data, error, count } = await supabase
      .from("problems")
      .select("id, grade, subject, category, difficulty, content, content_hash, created_at", { count: "exact" })
      .eq("grade", grade)
      .eq("subject", subject)
      .in("content->raw->>qtype", neededQtypes)
      .limit(5000);

    console.log("📊 [TEACHER/COMPOSE] Supabase 쿼리 결과 count:", count);
    console.log("📊 [TEACHER/COMPOSE] 실제 반환된 데이터 개수:", data?.length ?? 0);

    // 에러가 있으면 즉시 반환
    if (error) {
      console.error("❌ [TEACHER/COMPOSE] Supabase 쿼리 에러:", error);
      console.error("❌ [TEACHER/COMPOSE] Supabase 쿼리 에러 메시지:", error.message);
      console.error("❌ [TEACHER/COMPOSE] Supabase 쿼리 에러 상세:", JSON.stringify(error, null, 2));
      
      // RLS 에러 체크
      const isRLSError = error.message?.includes("RLS") || 
                         error.message?.includes("row-level security") ||
                         error.message?.includes("permission denied") ||
                         error.code === "PGRST301" ||
                         error.code === "42501";
      
      if (isRLSError) {
        return NextResponse.json(
          { 
            error: {
              message: "권한 문제(RLS) 또는 환경변수 Supabase 프로젝트 불일치",
              detail: `.env.local의 SUPABASE_URL과 SUPABASE_SERVICE_ROLE_KEY를 확인하세요. 원본 에러: ${error.message}`,
            },
          },
          { status: 403 }
        );
      }
      
      return NextResponse.json(
        { 
          error: {
            message: "Supabase 쿼리 실패",
            detail: error.message || "Unknown error",
          },
        },
        { status: 500 }
      );
    }

    // 필터링: content.raw.qtype이 있으면 사용, 없으면 category 기반으로 유추
    const rows = (data ?? []).filter(r => {
      const q = r?.content?.raw?.qtype;
      if (typeof q === "string" && ALLOWED_QTYPES.has(q)) {
        return true;
      }
      // qtype이 없으면 category 기반으로 유추해서 필요한 qtype 목록에 포함되는지 확인
      if (!q && r?.category) {
        const inferredQtype = inferQtypeFromCategory(r.category);
        return inferredQtype ? (neededQtypes as string[]).includes(inferredQtype) : false;
      }
      return false;
    });

    console.log("📊 [TEACHER/COMPOSE] 필터링 후 rows 개수:", rows.length);

    // ✅ 데이터 스냅샷 로그 (첫 1개만)
    if (rows.length > 0) {
      const sample = rows[0];
      const contentKeys = Object.keys(sample?.content ?? {});
      const rawKeys = Object.keys((sample?.content?.raw ?? {}) as any);
      const hasChoices1to5 = ["보기1", "보기2", "보기3", "보기4", "보기5"].some(k => 
        (sample?.content?.raw as any)?.[k] != null
      );
      const hasChoicesArray = Array.isArray((sample?.content?.raw as any)?.choices) || 
                              Array.isArray((sample?.content as any)?.choices);
      console.log("[TEACHER/COMPOSE] 데이터 스냅샷 (첫 항목):", {
        contentKeys,
        rawKeys,
        hasChoices1to5,
        hasChoicesArray,
        category: sample?.category,
        qtype: (sample?.content?.raw as any)?.qtype,
      });
    }

    // qtype별로 그룹핑하고 shuffle
    // qtype이 없으면 category 기반으로 유추
    const byQtype = new Map<string, any[]>();
    for (const r of rows) {
      try {
        let q = r.content?.raw?.qtype as string;
        // qtype이 없으면 category 기반으로 유추
        if (!q || typeof q !== "string") {
          const inferred = inferQtypeFromCategory(r.category);
          q = inferred ?? "";
          if (inferred) {
            console.log(`⚠️ [TEACHER/COMPOSE] qtype 없음, category 기반 유추: ${r.category} -> ${q}`);
          }
        }
        if (q && typeof q === "string" && (neededQtypes as string[]).includes(q)) {
          if (!byQtype.has(q)) byQtype.set(q, []);
          byQtype.get(q)!.push(r);
        }
      } catch (rowError: any) {
        console.warn("⚠️ [TEACHER/COMPOSE] row 처리 중 에러 (무시):", rowError);
      }
    }
    for (const [k, v] of byQtype.entries()) {
      byQtype.set(k, shuffle(v));
    }

    console.log("📊 [TEACHER/COMPOSE] qtype별 그룹:", Object.fromEntries(
      Array.from(byQtype.entries()).map(([k, v]) => [k, v.length])
    ));

    function pick(qtype: string, n: number) {
      const pool = byQtype.get(qtype) ?? [];
      const pickedPool = take(pool, n);
      byQtype.set(qtype, pool.slice(pickedPool.length));
      return pickedPool;
    }

    // 계획(plan)대로 각 카테고리에서 랜덤 문제 가져오기
    // 각 카테고리별 소분류 반반 분배
    const categoryItems: Record<string, any[]> = {
      vocabulary: [
        ...pick(QT.VOCAB_DICT, Math.floor(plan.vocabulary / 2)),
        ...pick(QT.VOCAB_ENG, Math.ceil(plan.vocabulary / 2)),
      ],
      dialogue: [
        ...pick(QT.DIA_BLANK, Math.floor(plan.dialogue / 2)),
        ...pick(QT.DIA_FLOW, Math.ceil(plan.dialogue / 2)),
      ],
      grammar: [
        ...pick(QT.GRAM_ERR, Math.floor(plan.grammar / 2)),
        ...pick(QT.GRAM_BLANK, Math.ceil(plan.grammar / 2)),
      ],
      reading: [
        ...pick(QT.READ_TITLE, Math.floor(plan.reading / 2)),
        ...pick(QT.READ_Q, Math.ceil(plan.reading / 2)),
      ],
    };

    // 카테고리별 실제 선택된 개수
    const actualCounts: CategoryCounts = {
      vocabulary: categoryItems.vocabulary.length,
      dialogue: categoryItems.dialogue.length,
      grammar: categoryItems.grammar.length,
      reading: categoryItems.reading.length,
    };

    // 부족한 카테고리 확인
    const shortages: Record<string, number> = {};
    if (actualCounts.vocabulary < plan.vocabulary) {
      shortages.vocabulary = plan.vocabulary - actualCounts.vocabulary;
    }
    if (actualCounts.dialogue < plan.dialogue) {
      shortages.dialogue = plan.dialogue - actualCounts.dialogue;
    }
    if (actualCounts.grammar < plan.grammar) {
      shortages.grammar = plan.grammar - actualCounts.grammar;
    }
    if (actualCounts.reading < plan.reading) {
      shortages.reading = plan.reading - actualCounts.reading;
    }

    console.log("📊 [TEACHER/COMPOSE] 계획:", plan);
    console.log("📊 [TEACHER/COMPOSE] 실제 선택:", actualCounts);
    console.log("📊 [TEACHER/COMPOSE] 부족:", shortages);

    // 부족한 문제가 있으면 자동 보정 시도
    let items = [
      ...categoryItems.vocabulary,
      ...categoryItems.dialogue,
      ...categoryItems.grammar,
      ...categoryItems.reading,
    ];

    // 자동 보정: 부족한 수량을 다른 카테고리에서 가져오기
    const totalShortage = Object.values(shortages).reduce((sum, val) => sum + val, 0);
    if (totalShortage > 0) {
      console.log("⚠️ [TEACHER/COMPOSE] 부족한 문제 자동 보정 시도:", totalShortage, "개");
      
      // 남은 문제 풀에서 부족한 만큼 채우기
      const remainingPool: any[] = [];
      for (const [qtype, pool] of byQtype.entries()) {
        remainingPool.push(...pool);
      }
      const shuffledRemaining = shuffle(remainingPool);
      
      // 중복 제거를 위한 ID Set
      const usedIds = new Set(items.map((item: any) => item.id));
      
      // 부족한 만큼 추가
      let added = 0;
      for (const item of shuffledRemaining) {
        if (added >= totalShortage) break;
        if (!usedIds.has(item.id)) {
          items.push(item);
          usedIds.add(item.id);
          added++;
        }
      }
      
      console.log("📊 [TEACHER/COMPOSE] 자동 보정 후:", items.length, "개 (추가:", added, "개)");
    }

    // 최종 검증: 여전히 부족하면 에러 반환
    const totalRequested = plan.vocabulary + plan.dialogue + plan.grammar + plan.reading;
    const totalActual = items.length;
    const finalShortage = totalRequested - totalActual;

    if (finalShortage > 0) {
      const shortageDetails = Object.entries(shortages)
        .filter(([_, count]) => count > 0)
        .map(([category, count]) => `${category}: ${count}개 부족`)
        .join(", ");

      console.error("❌ [TEACHER/COMPOSE] 문제 부족:", {
        requested: totalRequested,
        actual: totalActual,
        shortage: finalShortage,
        details: shortageDetails,
      });

      return NextResponse.json(
        {
          error: {
            message: "요청한 문제 수량을 충족할 수 없습니다",
            detail: `요청: ${totalRequested}개, 실제: ${totalActual}개 (부족: ${finalShortage}개). 부족한 카테고리: ${shortageDetails || "없음"}`,
          },
        },
        { status: 422 } // 422 Unprocessable Entity
      );
    }

    // 섞기
    const shuffledItems = shuffle(items);

    // 선생님 전용: text 포함하여 정규화
    const resultItems = shuffledItems.map((row: any) => {
      try {
        // qtype 결정: content.raw.qtype이 있으면 사용, 없으면 category 기반으로 유추
        const raw = row?.content?.raw ?? {};
        let qtype = raw.qtype;
        if (!qtype || typeof qtype !== "string") {
          const inferred = inferQtypeFromCategory(row.category);
          qtype = inferred ?? "";
        }

        // 기본 구조 생성
        const normalized = {
          id: row.id,
          category: normalizeTeacherCategory(row.category),
          qtype: qtype,
          difficulty: row.difficulty,
          content: row.content,
        };

        // ✅ 여기서 text를 강제로 만든다 (teacher preview용)
        const c = row?.content ?? {};
        const raw2 = c?.raw ?? c;
        const text =
          (raw2?.question ?? raw2?.stem ?? raw2?.text ?? raw2?.prompt ??
           raw2?.sentence ?? raw2?.dialogue ?? raw2?.line ?? raw2?.cloze ??
           raw2?.ask ?? raw2?.passage ?? raw2?.reading ?? raw2?.article ??
           c?.question ?? c?.stem ?? c?.text ?? c?.prompt ?? c?.passage ?? c?.reading ?? c?.article ?? ""
          ).toString().trim();

        // ✅ 최종 반환에 text를 붙여라
        return { 
          ...normalized, 
          text,
          // 선택: preview/인쇄에 필요한 값들
          choices: row?.content?.raw?.choices ?? row?.content?.choices ?? [],
          answer: row?.content?.raw?.answer ?? row?.content?.answer ?? null,
          explanation: row?.content?.raw?.explanation ?? row?.content?.explanation ?? "",
        };
      } catch (itemError: any) {
        console.error("❌ [TEACHER/COMPOSE] resultItem 변환 중 에러:", itemError);
        throw itemError;
      }
    });

    // 디버그: text가 실제로 만들어지고 있는지 확인
    console.log("[TEACHER/COMPOSE] first text:", resultItems?.[0]?.text);

    console.log("✅ [TEACHER/COMPOSE] 성공:", {
      total: resultItems.length,
      plan,
      actualCounts,
    });

    // ✅ 반환 직전에 text 강제 보정
    function deepFindText(v: any): string {
      if (!v) return "";
      if (typeof v === "string") {
        const s = v.trim();
        return s.length >= 6 ? s : "";
      }
      if (Array.isArray(v)) {
        for (const it of v) {
          const found = deepFindText(it);
          if (found) return found;
        }
        return "";
      }
      if (typeof v === "object") {
        const skip = new Set(["explanation", "solution", "commentary"]);
        for (const k of Object.keys(v)) {
          if (skip.has(k)) continue;
          const found = deepFindText(v[k]);
          if (found) return found;
        }
      }
      return "";
    }

    // ✅ 반환 직전에 "무조건 text 보장"
    const safeItems = (resultItems ?? []).map((it: any) => {
      const c = it?.content ?? {};
      const raw = c?.raw ?? c;

      const text =
        String(
          (it?.text ??
            raw?.question ??
            raw?.stem ??
            raw?.text ??
            raw?.prompt ??
            raw?.sentence ??
            raw?.dialogue ??
            raw?.line ??
            raw?.cloze ??
            raw?.ask ??
            raw?.passage ??
            raw?.reading ??
            raw?.article ??
            deepFindText(raw) ??
            deepFindText(c) ??
            deepFindText(it) ??
            "")
        ).trim();

      return { ...it, text }; // ✅ text는 맨 마지막에 덮어쓰기
    });

    console.log("[TEACHER/COMPOSE] safeItems first keys:", Object.keys(safeItems?.[0] ?? {}));
    console.log("[TEACHER/COMPOSE] safeItems first text:", (safeItems?.[0]?.text ?? "").slice(0, 80));

    // ✅ 카테고리 순서 고정: 어휘 → 문법 → 대화문 → 본문
    const order: Record<string, number> = {
      vocabulary: 0,
      grammar: 1,
      dialogue: 2,
      reading: 3,
    };

    // resultItems에 category가 이미 normalizeTeacherCategory로 들어간다는 전제
    safeItems.sort((a: any, b: any) => {
      const ao = order[String(a?.category ?? "").trim()] ?? 99;
      const bo = order[String(b?.category ?? "").trim()] ?? 99;
      return ao - bo;
    });

    // 성공 응답: items와 plan 포함
    return NextResponse.json(
      {
        ok: true,
        items: safeItems, // ✅ 여기 반드시 safeItems
        plan: {
          vocab: plan.vocabulary,
          dialogue: plan.dialogue,
          grammar: plan.grammar,
          reading: plan.reading,
        },
        actualCounts,
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("[/api/teacher/compose] error:", err);
    return NextResponse.json(
      {
        ok: false,
        error: {
          message: err instanceof Error ? err.message : String(err),
        },
      },
      { status: 500 }
    );
  }
}
