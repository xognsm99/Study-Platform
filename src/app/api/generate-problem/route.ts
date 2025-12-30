import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    // env 체크
    const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.SUPABASE_ANON_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!url || !anonKey) {
      return NextResponse.json(
        { ok: false, error: "Supabase env vars are missing" },
        { status: 500 }
      );
    }

    // ✅ 단순 클라이언트 생성 (cookieStore 에러 방지)
    const supabase = createClient(url, anonKey);

    const body = await req.json().catch(() => ({}));

    console.log("GEN_PARAMS", {
      grade: body.grade,
      subject: body.subject,
      category: body.category,
      categories: body.categories,
      qtype: body.qtype,
    });

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
      영어: "english",
      수학: "math",
      국어: "korean",
      과학: "science",
    };
    let subject = body.subject ?? "english";
    if (typeof subject === "string" && subjectMap[subject]) {
      subject = subjectMap[subject];
    }

    // ✅ category 정규화: vocabulary->vocab, body->reading 등
    const categoryMap: Record<string, string> = {
      어휘: "vocab",
      vocabulary: "vocab",
      vocab: "vocab",
      문법: "grammar",
      grammar: "grammar",
      본문: "reading",
      body: "reading",
      reading: "reading",
      대화문: "dialogue",
      dialogue: "dialogue",
    };

    // ✅ categories 배열 지원 (category 단일값도 호환)
    let categoriesToQuery: string[] = [];

    if (Array.isArray(body.categories)) {
      if (body.categories.length === 0) {
        return NextResponse.json(
          { ok: false, error: "categories 배열이 비어있습니다. 유형을 선택해 주세요." },
          { status: 400 }
        );
      }

      categoriesToQuery = body.categories
        .map((cat: string) => categoryMap[cat] || cat)
        .filter((cat: string) =>
          ["vocab", "grammar", "reading", "dialogue"].includes(cat)
        );

      if (categoriesToQuery.length === 0) {
        return NextResponse.json(
          {
            ok: false,
            error:
              "유효한 카테고리가 없습니다. vocab, grammar, reading, dialogue 중 하나를 선택해 주세요.",
          },
          { status: 400 }
        );
      }
    } else if (body.category) {
      const mappedCategory = categoryMap[body.category] || body.category;
      if (["vocab", "grammar", "reading", "dialogue"].includes(mappedCategory)) {
        categoriesToQuery = [mappedCategory];
      }
    } else {
      return NextResponse.json(
        { ok: false, error: "category 또는 categories를 지정해 주세요." },
        { status: 400 }
      );
    }

    console.log("QUERY_PARAMS", { grade, subject, categories: categoriesToQuery });
    console.log("[generate-problem] 실제 쿼리 categories:", categoriesToQuery);

    // ✅ DB에서 가져오기 (qtype 컬럼 필터는 하지 않음: 테이블 구조 차이로 에러 날 수 있음)
    let query = supabase
      .from("problems")
      .select("id, grade, subject, category, difficulty, content, content_hash")
      .eq("grade", grade)
      .eq("subject", subject)
      .in("category", categoriesToQuery);

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
          error: `선택한 유형의 문제가 없습니다. 조건 확인: grade="${grade}", subject="${subject}", categories=[${categoriesToQuery.join(
            ", "
          )}]`,
        },
        { status: 404 }
      );
    }

    // 서버에서 섞기
    const shuffled = [...allData].sort(() => Math.random() - 0.5);

    // 20개만 선택
    const targetCount = 20;
    const pickedRows = shuffled.slice(0, Math.min(targetCount, shuffled.length));

    // =========================
    // ✅ 5지선다 + 키패드 모두 지원
    // =========================
    const problems = pickedRows
      .map((row: any) => {
        const content: any = row.content || {};
        const raw: any = content.raw || {};

        const qtype =
          String(row.qtype ?? content.qtype ?? raw.qtype ?? "").trim() || null;

        const isKeypad =
          content.mode === "keypad" ||
          qtype === "퀴즈_키패드" ||
          String(content.mode ?? "").toLowerCase() === "keypad";

        const typeRaw = (row.category || "").toLowerCase();
        const allowed = ["dialogue", "vocab", "reading", "grammar"] as const;
        let normType: (typeof allowed)[number] = "reading";
        if (typeRaw.includes("dialog")) normType = "dialogue";
        else if (typeRaw.includes("vocab") || typeRaw.includes("word") || typeRaw.includes("어휘"))
          normType = "vocab";
        else if (typeRaw.includes("grammar") || typeRaw.includes("문법"))
          normType = "grammar";

        // ✅ 키패드 문제
        if (isKeypad) {
          const sentence = String(
            content.sentence ?? raw.문제 ?? raw.question ?? ""
          )
            .replace(/\(\s*\)/g, "()")
            .trim();

          const answers = Array.isArray(content.answers)
            ? content.answers.map((v: any) => String(v).trim()).filter(Boolean)
            : typeof content.answers === "string"
            ? [content.answers.trim()].filter(Boolean)
            : [];

          const options = Array.isArray(content.options)
            ? content.options.map((v: any) => String(v).trim()).filter(Boolean)
            : [];

          const explanation =
            String(content.explanation ?? raw.explanation ?? "").trim() ||
            "해설이 제공되지 않았습니다.";

          const passage =
            content.body != null
              ? String(content.body)
              : raw.지문 != null
              ? String(raw.지문)
              : undefined;

          // 최소 검증: sentence/answers는 있어야 함 (options는 없어도 일단 통과)
          if (!sentence || answers.length === 0) return null;

          return {
            id: row.id,
            mode: "keypad",
            qtype,
            sentence,
            answers,
            options,
            explanation,
            type: "vocab",
            category: "vocab",
            difficulty: row.difficulty || "medium",
            passage,
            content: row.content, // 원본 그대로
          };
        }

        // ✅ 5지선다(기존)
        const question = String(
          raw.question ?? content.stem ?? raw["문제"] ?? raw.문제 ?? ""
        ).trim();

        const choices = [
          String(raw["보기1"] ?? raw.보기1 ?? raw.choice1 ?? content.choices?.[0] ?? "").trim(),
          String(raw["보기2"] ?? raw.보기2 ?? raw.choice2 ?? content.choices?.[1] ?? "").trim(),
          String(raw["보기3"] ?? raw.보기3 ?? raw.choice3 ?? content.choices?.[2] ?? "").trim(),
          String(raw["보기4"] ?? raw.보기4 ?? raw.choice4 ?? content.choices?.[3] ?? "").trim(),
          String(raw["보기5"] ?? raw.보기5 ?? raw.choice5 ?? content.choices?.[4] ?? "").trim(),
        ];

        // 보기 누락이면 제외
        if (choices.some((ch: string) => !ch || ch.length === 0)) {
          return null;
        }

        // 정답번호 1~5
        const answerNo =
          typeof raw["정답번호"] === "number"
            ? raw["정답번호"]
            : typeof raw.정답번호 === "number"
            ? raw.정답번호
            : typeof raw.answer_no === "number"
            ? raw.answer_no
            : typeof content.answer === "number"
            ? content.answer
            : null;

        if (!answerNo || answerNo < 1 || answerNo > 5) {
          return null;
        }

        const answerIndex = answerNo - 1;

        const explanation =
          String(content.explanation ?? raw.explanation ?? "").trim() ||
          "해설이 제공되지 않았습니다.";

        const passage =
          content.body != null
            ? String(content.body)
            : raw.지문 != null
            ? String(raw.지문)
            : raw.passage != null
            ? String(raw.passage)
            : undefined;

        return {
          id: row.id,
          mode: "mcq",
          qtype,
          question,
          choices,
          answerIndex,
          explanation,
          type: normType,
          category: normType,
          difficulty: row.difficulty || "medium",
          passage,
          content: row.content,
        };
      })
      .filter((p: any) => p !== null);

    // 최종 개수 확인 및 로그
    const validProblemsCount = problems.length;
    const excludedCount = pickedRows.length - validProblemsCount;

    if (excludedCount > 0) {
      console.log(
        `[generate-problem] 필터링: ${excludedCount}개 제외 (5지선다: 보기/정답 불완전, 키패드: sentence/answers 없음)`
      );
    }

    if (validProblemsCount < targetCount) {
      console.warn(
        `[generate-problem] 선택한 유형의 문제가 부족합니다: 요청 ${targetCount}개, 실제 ${validProblemsCount}개`
      );
    }

    // ✅ items (프린트/간단 표시용)
    const items = problems.map((p: any) => {
      if (p.mode === "keypad") {
        return {
          question: p.sentence,
          choices: p.options ?? [],
          answer: Array.isArray(p.answers) ? p.answers.join(",") : "",
          explanation: p.explanation,
          type: "vocab",
          difficulty: p.difficulty,
          passage: p.passage,
          mode: "keypad",
        };
      }
      return {
        question: p.question,
        choices: p.choices,
        answer: p.choices[p.answerIndex] ?? "",
        explanation: p.explanation,
        type: p.type,
        difficulty: p.difficulty,
        passage: p.passage,
        mode: "mcq",
      };
    });

    // ✅ answerKey (문제 순서와 동일하게)
    const answerKey = problems.map((p: any, idx: number) => {
      if (p.mode === "keypad") {
        return {
          no: idx + 1,
          mode: "keypad",
          answer_text: Array.isArray(p.answers) ? p.answers.join(",") : "",
        };
      }
      return {
        no: idx + 1,
        mode: "mcq",
        answer_no: (p.answerIndex ?? 0) + 1,
        answer: p.choices?.[p.answerIndex] ?? "",
      };
    });

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
