import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

// ✅ 단순 클라이언트 생성 (cookieStore 에러 방지)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// BUCKETS는 더 이상 사용하지 않음 (직접 쿼리로 변경)
// category 정규화: vocab, grammar, reading, dialogue

export async function POST(req: Request) {
  try {
    // 환경 변수 체크
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      return NextResponse.json(
        { ok: false, error: "Supabase 환경 변수가 설정되지 않았습니다." },
        { status: 500 }
      );
    }

    const body = await req.json().catch(() => ({}));
    
    // ✅ 요청 body에서 실제로 받는 값들을 로그로 출력
    console.log("GEN_PARAMS", { 
      grade: body.grade, 
      subject: body.subject, 
      category: body.category, 
      categories: body.categories, 
      qtype: body.qtype 
    });
    
    // ✅ student 요청 수신 시 categories를 그대로 로그로 출력
    if (Array.isArray(body.categories)) {
      console.log("[generate-problem] student 요청 categories:", body.categories);
    }
    
    // grade/subject 정규화 강제
    let grade = body.grade ?? "2";
    if (typeof grade === "string" && grade.startsWith("중")) {
      grade = grade.replace("중", "");
    } else if (typeof grade === "string" && grade.startsWith("고")) {
      grade = grade.replace("고", "");
    }
    
    const subjectMap: Record<string, string> = {
      "영어": "english",
      "수학": "math",
      "국어": "korean",
      "과학": "science",
    };
    let subject = body.subject ?? "english";
    if (typeof subject === "string" && subjectMap[subject]) {
      subject = subjectMap[subject];
    }
    
    // ✅ category 정규화: vocabulary->vocab, body->reading 등
    const categoryMap: Record<string, string> = {
      "어휘": "vocab",
      "vocabulary": "vocab",
      "vocab": "vocab",
      "문법": "grammar",
      "grammar": "grammar",
      "본문": "reading",
      "body": "reading",
      "reading": "reading",
      "대화문": "dialogue",
      "dialogue": "dialogue",
    };
    
    // ✅ categories 배열 지원 (category 단일값도 호환)
    let categoriesToQuery: string[] = [];
    
    if (Array.isArray(body.categories)) {
      if (body.categories.length === 0) {
        // ✅ categories가 빈 배열이면 400 에러 반환 (기본값으로 대체하지 않음)
        return NextResponse.json(
          { ok: false, error: "categories 배열이 비어있습니다. 유형을 선택해 주세요." },
          { status: 400 }
        );
      }
      // categories 배열이 있으면 각각 정규화 (선택된 것만 사용)
      categoriesToQuery = body.categories
        .map((cat: string) => categoryMap[cat] || cat)
        .filter((cat: string) => ["vocab", "grammar", "reading", "dialogue"].includes(cat));
      
      // 정규화 후에도 빈 배열이면 에러
      if (categoriesToQuery.length === 0) {
        return NextResponse.json(
          { ok: false, error: "유효한 카테고리가 없습니다. vocab, grammar, reading, dialogue 중 하나를 선택해 주세요." },
          { status: 400 }
        );
      }
    } else if (body.category) {
      // category 단일값이 있으면 정규화 (호환성 유지)
      const mappedCategory = categoryMap[body.category] || body.category;
      if (["vocab", "grammar", "reading", "dialogue"].includes(mappedCategory)) {
        categoriesToQuery = [mappedCategory];
      }
    } else {
      // categories도 category도 없으면 에러 (기본값으로 대체하지 않음)
      return NextResponse.json(
        { ok: false, error: "category 또는 categories를 지정해 주세요." },
        { status: 400 }
      );
    }
    
    // ✅ 실제 쿼리도 categories 그대로 사용했는지 로그
    console.log("QUERY_PARAMS", { grade, subject, categories: categoriesToQuery });
    console.log("[generate-problem] 실제 쿼리 categories:", categoriesToQuery);
    
    // ✅ 직접 쿼리: grade, subject, category만 필터
    // ✅ 반드시 grade, subject 기본 필터
    // ✅ category는 DB값(vocab/grammar/reading/dialogue)과 정확히 일치
    // ✅ qtype 컬럼을 where로 쓰지 않음 (테이블에 없음)
    let query = supabase
      .from("problems")
      .select("id, grade, subject, category, difficulty, content, content_hash")
      .eq("grade", grade)
      .eq("subject", subject)
      .in("category", categoriesToQuery);
    
    // 절대 created_by, difficulty, qtype, user_id 필터 추가하지 않음
    
    // 최대 200개 가져온 뒤 서버에서 섞어서 20개 반환
    const { data: allData, error: queryError, count } = await query
      .order("created_at", { ascending: false })
      .limit(200);
    
    console.log("DB_COUNT", count, "ERROR", queryError);
    
    if (queryError) {
      console.error("[generate-problem] Supabase 쿼리 에러:", queryError);
      console.error("[generate-problem] 에러 메시지:", queryError.message);
      return NextResponse.json(
        { ok: false, error: queryError.message || "Supabase 쿼리 실패" },
        { status: 500 }
      );
    }
    
    if (!allData || allData.length === 0) {
      console.error("[generate-problem] 문제 0개 - 조건 확인:");
      console.error(`- grade: "${grade}"`);
      console.error(`- subject: "${subject}"`);
      console.error(`- categories: [${categoriesToQuery.join(", ")}]`);
      return NextResponse.json(
        { 
          ok: false, 
          error: `선택한 유형의 문제가 없습니다. 조건 확인: grade="${grade}", subject="${subject}", categories=[${categoriesToQuery.join(", ")}]` 
        },
        { status: 404 }
      );
    }
    
    // 서버에서 섞기
    const shuffled = [...allData].sort(() => Math.random() - 0.5);
    
    // 20개만 선택 (선택된 categories 범위에서만)
    const targetCount = 20;
    const pickedProblems = shuffled.slice(0, Math.min(targetCount, shuffled.length));
    
    // ✅ 선택된 categories 범위에서만 뽑고, 부족하면 메시지 반환
    if (pickedProblems.length < targetCount) {
      console.warn(`[generate-problem] 선택한 유형의 문제가 부족합니다: 요청 ${targetCount}개, 실제 ${pickedProblems.length}개`);
      // 200으로 반환하되 메시지 포함 (또는 409로 반환 가능)
      // 여기서는 200으로 반환하고 메시지를 포함시킴
    }

    // 프론트에서 쓰기 좋은 구조로 변환 (5지선다 표준화)
    const problems = pickedProblems
      .map((row) => {
        const c: any = row.content?.raw || row.content || {};

        const question = String(c.question ?? "").trim();
        
        // ✅ 보기1~보기5를 읽어서 5지선다 배열 생성
        const choices = [
          String(c["보기1"] ?? c.보기1 ?? c.choice1 ?? c.choices?.[0] ?? "").trim(),
          String(c["보기2"] ?? c.보기2 ?? c.choice2 ?? c.choices?.[1] ?? "").trim(),
          String(c["보기3"] ?? c.보기3 ?? c.choice3 ?? c.choices?.[2] ?? "").trim(),
          String(c["보기4"] ?? c.보기4 ?? c.choice4 ?? c.choices?.[3] ?? "").trim(),
          String(c["보기5"] ?? c.보기5 ?? c.choice5 ?? c.choices?.[4] ?? "").trim(),
        ];

        // ✅ 보기1~5 모두 non-empty 검증
        if (choices.some((ch: string) => !ch || ch.length === 0)) {
          return null; // 보기 누락
        }

        // ✅ 정답번호 1~5 검증
        const answerNo = typeof c["정답번호"] === "number" 
          ? c["정답번호"]
          : typeof c.정답번호 === "number"
          ? c.정답번호
          : typeof c.answer_no === "number"
          ? c.answer_no
          : typeof c.answer === "number"
          ? c.answer
          : null;

        if (!answerNo || answerNo < 1 || answerNo > 5) {
          return null; // 정답번호 유효하지 않음
        }

        const answerIndex = answerNo - 1; // 1~5를 0~4로 변환

        const explanation = String(c.explanation ?? "").trim() || "해설이 제공되지 않았습니다.";

        const typeRaw = (row.category || "").toLowerCase();
        const allowed = ["dialogue", "vocab", "reading", "grammar"] as const;
        let normType: (typeof allowed)[number] = "reading";
        if (typeRaw.includes("dialog")) normType = "dialogue";
        else if (typeRaw.includes("vocab") || typeRaw.includes("word") || typeRaw.includes("어휘"))
          normType = "vocab";
        else if (typeRaw.includes("grammar") || typeRaw.includes("문법"))
          normType = "grammar";

        return {
          id: row.id,
          question,
          choices,
          answerIndex,
          explanation,
          type: normType,
          category: normType,
          difficulty: row.difficulty || "medium",
          passage: c.passage ? String(c.passage) : undefined,
          sentences: c.sentences,
          content: row.content, // 원본 content도 포함
        };
      })
      .filter((p: any) => p !== null); // null 제거

    // 최종 개수 확인 및 로그
    const validProblemsCount = problems.length;
    const excludedCount = pickedProblems.length - validProblemsCount;
    
    if (excludedCount > 0) {
      console.log(`[generate-problem] 5지선다 필터링: ${excludedCount}개 제외 (보기1~5 누락 또는 정답번호 1~5 아님)`);
    }
    
    // ✅ 선택된 categories 범위에서만 뽑고, 부족하면 메시지 포함
    if (validProblemsCount < targetCount) {
      console.warn(`[generate-problem] 선택한 유형의 문제가 부족합니다: 요청 ${targetCount}개, 실제 ${validProblemsCount}개`);
    }

    const items = problems.map((p) => ({
      question: p.question,
      choices: p.choices,
      answer: p.choices[p.answerIndex] ?? "",
      explanation: p.explanation,
      type: p.type,
      difficulty: p.difficulty,
      passage: p.passage,
    }));

    // 정답지(깔끔하게)
    const answerKey = pickedProblems.map((p, idx) => {
      const c: any = p.content?.raw || p.content || {};
      return {
        no: idx + 1,
        answer_no: c.answer_no ?? null,
      };
    });

    // ✅ 문제가 부족하면 메시지 포함하여 반환
    const response: any = { ok: true, problems, items, answerKey };
    if (validProblemsCount < targetCount) {
      response.message = `선택한 유형의 문제가 부족합니다 (현재 ${validProblemsCount}개)`;
    }
    
    return NextResponse.json(response);
  } catch (e: any) {
    console.error("[generate-problem] fatal:", e);
    return NextResponse.json(
      { ok: false, error: e?.message || "unknown error" },
      { status: 500 }
    );
  }
}
