import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { consumeFreeUsage } from "@/lib/usage";
import { cookies } from "next/headers";

export const runtime = "nodejs";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

// qtype 상수 정의
const QT = {
  VOCAB_DICT: "어휘_사전",
  VOCAB_ENG: "어휘_영영",
  VOCAB_CTX: "어휘_문맥",
  GRAM_ERR: "문법_어법오류",
  GRAM_BLANK: "문법_빈칸",
  GRAM_ORDER: "문법_배열",
  READ_TITLE: "본문_제목",
  READ_Q: "본문_물음",
  READ_MATCH: "본문_일치",
  DIA_BLANK: "대화문_빈칸",
  DIA_FLOW: "대화문_흐름",
  DIA_REPLY: "대화문_응답",
} as const;

// 그룹별 qtype 매핑
const GROUP_QTYPES: Record<string, string[]> = {
  vocab: [QT.VOCAB_DICT, QT.VOCAB_ENG, QT.VOCAB_CTX],
  grammar: [QT.GRAM_ERR, QT.GRAM_BLANK, QT.GRAM_ORDER],
  reading: [QT.READ_TITLE, QT.READ_Q, QT.READ_MATCH],
  dialogue: [QT.DIA_BLANK, QT.DIA_FLOW, QT.DIA_REPLY],
};

// 그룹별 category 매핑 (DB에 저장된 실제 값 사용)
const GROUP_CATEGORIES: Record<string, string> = {
  vocab: "vocab",  // DB에 vocab으로 저장됨
  grammar: "grammar",
  reading: "reading",
  dialogue: "dialogue",
};

function shuffle<T>(arr: T[]) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export async function POST(req: Request) {
  // 환경 변수 체크
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json(
      { ok: false, error: "Supabase 환경 변수가 설정되지 않았습니다." },
      { status: 500 }
    );
  }

  // 사용자 인증 확인
  let userId: string | null = null;
  try {
    const cookieStore = await cookies();
    const accessToken = cookieStore.get("sb-access-token")?.value;
    const refreshToken = cookieStore.get("sb-refresh-token")?.value;

    if (accessToken && refreshToken) {
      const authClient = createClient(
        process.env.SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { auth: { persistSession: false } }
      );
      await authClient.auth.setSession({ access_token: accessToken, refresh_token: refreshToken });
      const { data: { user } } = await authClient.auth.getUser();
      userId = user?.id ?? null;
    }
  } catch (authError) {
    console.warn("[student/compose] 인증 확인 실패 (무료 제한 미적용):", authError);
  }

  // 무료 사용 제한 체크 (로그인 유저만)
  if (userId) {
    try {
      const gate = await consumeFreeUsage(userId, "student_generate");
      if (!gate.allowed) {
        console.log(`[student/compose] 무료 제한 초과: userId=${userId}, remaining=${gate.remaining}`);
        return NextResponse.json(
          { needsSubscription: true, reason: "student_generate" },
          { status: 403 }
        );
      }
      console.log(`[student/compose] 무료 제한 통과: userId=${userId}, remaining=${gate.remaining}`);
    } catch (usageError) {
      console.error("[student/compose] consumeFreeUsage 에러:", usageError);
      // 제한 체크 실패 시 요청 계속 진행 (에러로 차단하지 않음)
    }
  }

  const body = await req.json().catch(() => ({}));
  
  // grade/subject 값 정규화 (UI는 한글, 쿼리는 영어)
  let grade = body.grade ?? "2";
  let subject = body.subject ?? "english";
  
  // grade 정규화: "중2" -> "2", "중1" -> "1" 등
  if (typeof grade === "string" && grade.startsWith("중")) {
    grade = grade.replace("중", "");
  } else if (typeof grade === "string" && grade.startsWith("고")) {
    grade = grade.replace("고", "");
  }
  
  // subject 정규화: "영어" -> "english" 등
  const subjectMap: Record<string, string> = {
    "영어": "english",
    "수학": "math",
    "국어": "korean",
    "과학": "science",
  };
  if (typeof subject === "string" && subjectMap[subject]) {
    subject = subjectMap[subject];
  }
  
  const groups: string[] = body.groups ?? ["vocab", "grammar", "reading", "dialogue"];

  // 디버그 로그: API 호출 파라미터
  console.log("🔍 API 호출 파라미터 (원본):", { grade: body.grade, subject: body.subject, groups: body.groups });
  console.log("🔍 API 호출 파라미터 (정규화):", { grade, subject, groups });

  // 선택된 그룹의 모든 qtype 수집
  const neededQtypes: string[] = [];
  for (const group of groups) {
    const qtypes = GROUP_QTYPES[group] || [];
    neededQtypes.push(...qtypes);
  }

  if (neededQtypes.length === 0) {
    return NextResponse.json(
      { ok: false, error: "선택된 문제 유형이 없습니다." },
      { status: 400 }
    );
  }

  // Supabase 쿼리: category 또는 qtype으로 필터링
  // category 컬럼이 있으면 category로, 없으면 qtype으로 필터
  const categories = groups.map((g) => GROUP_CATEGORIES[g]).filter(Boolean);
  
  // created_by 필터는 제거 (공유 문제는 created_by가 NULL일 수 있음)
  // "내 문제만 보기" 옵션이 있을 때만 created_by 필터 적용
  const createdByFilter = null; // 학생 모드에서는 created_by 필터 사용 안 함
  
  // 디버그 로그: Supabase 조회 조건
  console.log("🔍 Supabase 조회 조건:", {
    grade,
    subject,
    categories,
    neededQtypes,
    qtypeCount: neededQtypes.length,
    createdByFilter,
  });
  
  // ✅ qtype 컬럼으로 필터 (DB에 qtype 컬럼 존재)
  // category 필터링도 추가 (category 컬럼이 있으면)
  let query = supabase
    .from("problems")
    .select("id, grade, subject, category, difficulty, content, content_hash", { count: "exact" })
    .eq("grade", grade)
    .eq("subject", subject);
  
  // created_by 필터는 절대 추가하지 않음 (공유 문제 포함)
  // 필요하면 "내 문제만 보기" 옵션일 때만 추가
  
  // category 필터링 추가 (categories 배열이 있으면)
  if (categories.length > 0) {
    query = query.in("category", categories);
  }
  
  // qtype 필터링 추가
  query = query.in("qtype", neededQtypes);

  // 쿼리 직전 로그
  console.log("QUERY_PARAMS", { grade, subject, category: categories, createdByFilter });

  const { data, error, count } = await query.limit(5000);
  
  // count 로그
  console.log("QUERY_COUNT", count, "ERR", error);

  // 디버그 로그: Supabase 쿼리 결과
  console.log("📊 Supabase 쿼리 결과 count:", count);
  console.log("📊 실제 반환된 데이터 개수:", data?.length ?? 0);

  // 에러가 있으면 즉시 반환 (0개로 처리하지 않음)
  if (error) {
    console.error("❌ Supabase 쿼리 에러:", error);
    console.error("❌ Supabase 쿼리 에러 메시지:", error.message);
    console.error("❌ Supabase 쿼리 에러 상세:", JSON.stringify(error, null, 2));
    
    // RLS 에러 체크
    const isRLSError = error.message?.includes("RLS") || 
                       error.message?.includes("row-level security") ||
                       error.message?.includes("permission denied") ||
                       error.code === "PGRST301" ||
                       error.code === "42501";
    
    if (isRLSError) {
      return NextResponse.json(
        { 
          ok: false, 
          error: "권한 문제(RLS) 또는 환경변수 Supabase 프로젝트 불일치. .env.local의 SUPABASE_URL과 SUPABASE_SERVICE_ROLE_KEY를 확인하세요.",
          errorMessage: error.message,
          errorDetails: JSON.stringify(error, null, 2),
        },
        { status: 403 }
      );
    }
    
    return NextResponse.json(
      { 
        ok: false, 
        error: error.message || "Supabase 쿼리 실패",
        errorMessage: error.message,
        errorDetails: JSON.stringify(error, null, 2),
      },
      { status: 500 }
    );
  }

  const rows = (data ?? []).filter((r) => {
    const qtype = r?.content?.raw?.qtype || r?.content?.qtype;
    // qtype으로 필터링 (이미 Supabase 쿼리에서 필터링되었지만, 추가 검증)
    if (typeof qtype === "string" && neededQtypes.includes(qtype)) {
      return true;
    }
    // category로 필터링 (qtype이 없는 경우 대비)
    if (r.category && categories.includes(r.category)) {
      return true;
    }
    return false;
  });

  // qtype별로 그룹핑
  const byQtype = new Map<string, any[]>();
  for (const r of rows) {
    const qtype = r?.content?.raw?.qtype || r?.content?.qtype;
    if (typeof qtype === "string" && neededQtypes.includes(qtype)) {
      if (!byQtype.has(qtype)) byQtype.set(qtype, []);
      byQtype.get(qtype)!.push(r);
    }
  }

  // 각 qtype 셔플
  for (const [k, v] of byQtype.entries()) {
    byQtype.set(k, shuffle(v));
  }

  // 20문항 뽑기 (그룹별 균등 분배)
  const targetCount = 20;
  const picked: any[] = [];
  const usedIds = new Set<string>();

  // 각 그룹에서 균등하게 뽑기
  const perGroup = Math.floor(targetCount / groups.length);
  const remainder = targetCount % groups.length;

  for (let i = 0; i < groups.length; i++) {
    const group = groups[i];
    const qtypes = GROUP_QTYPES[group] || [];
    const countForGroup = perGroup + (i < remainder ? 1 : 0);

    let pickedForGroup = 0;
    for (const qtype of qtypes) {
      if (pickedForGroup >= countForGroup) break;
      const pool = byQtype.get(qtype) || [];
      for (const item of pool) {
        if (pickedForGroup >= countForGroup) break;
        if (!usedIds.has(item.id)) {
          picked.push(item);
          usedIds.add(item.id);
          pickedForGroup++;
        }
      }
    }
  }

  // 부족하면 나머지에서 채우기
  if (picked.length < targetCount) {
    const need = targetCount - picked.length;
    for (const [qtype, pool] of byQtype.entries()) {
      if (picked.length >= targetCount) break;
      for (const item of pool) {
        if (picked.length >= targetCount) break;
        if (!usedIds.has(item.id)) {
          picked.push(item);
          usedIds.add(item.id);
        }
      }
    }
  }

  // 최종 개수 확인 (20개 이상이면 20개만 사용)
  if (picked.length > targetCount) {
    picked.splice(targetCount);
  }

  // 부족 경고
  if (picked.length < targetCount) {
    console.warn(
      `⚠️  부족한 문항: 요청 ${targetCount}개, 실제 ${picked.length}개 (부족 ${targetCount - picked.length}개)`
    );
  }

  // 섞기
  const shuffled = shuffle(picked);

  // QuizClient가 요구하는 ProblemItem 형태로 변환
  const problems = shuffled.map((row: any) => {
    const raw = row?.content?.raw ?? row?.content ?? {};
    
    const question = String(raw.question ?? "").trim();
    const choices = Array.isArray(raw.choices)
      ? raw.choices.map((x: any) => String(x)).slice(0, 5) // 최대 5개
      : [];
    
    // answer 또는 answer_no를 answerIndex로 변환 (1-based -> 0-based)
    const answerValue = raw.answer ?? raw.answer_no;
    const answerIndex =
      typeof answerValue === "number" && answerValue >= 1 && answerValue <= choices.length
        ? answerValue - 1
        : 0;

    const explanation = String(raw.explanation ?? "").trim() || "해설이 제공되지 않았습니다.";

    // type 결정
    const categoryLower = (row.category || "").toLowerCase();
    let type: "dialogue" | "vocab" | "reading" = "reading";
    if (categoryLower.includes("dialog")) type = "dialogue";
    else if (categoryLower.includes("vocab") || categoryLower.includes("word") || categoryLower.includes("어휘"))
      type = "vocab";

    return {
      id: row.id,
      question,
      choices,
      answerIndex,
      explanation,
      difficulty: row.difficulty || "medium",
      type,
      passage: raw.passage ? String(raw.passage) : undefined,
    };
  });

  return NextResponse.json({ ok: true, problems });
}

