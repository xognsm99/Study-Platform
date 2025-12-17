import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import crypto from "crypto";

function sha256(input: string) {
  return crypto.createHash("sha256").update(input).digest("hex");
}

export async function POST(req: Request) {
  try {
    const supabase = await supabaseServer();
    const { data: auth } = await supabase.auth.getUser();
    
    if (!auth.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));

    const {
      grade,
      subject,
      category,       // "dialogue" | "vocab" | "reading" 또는 한글도 가능
      difficulty = "medium",
      question,
      choices,
      answerIndex,
      explanation,
      passage,
      sentences,
    } = body;

    // ✅ content에 전부 넣는 구조
    const content = {
      question,
      choices,
      answerIndex,
      explanation,
      passage,
      sentences,
      type: category, // 선택사항이지만 넣어두면 나중에 안전
    };

    const content_hash = sha256(JSON.stringify(content));

    // ✅ grade는 text 컬럼이므로 String 처리
    // 참고: 현재 스키마는 int이지만, 사용자 요청에 따라 text로 처리
    // 숫자 추출: "중2" -> 2, "고1" -> 1 (스키마가 int인 경우)
    const gradeText = String(grade ?? "").trim();
    const gradeNum = typeof grade === "number" 
      ? grade 
      : Number(gradeText.replace(/\D/g, "")) || 1;

    // ✅ category도 text 컬럼 (타입 역할)
    const categoryText = String(category ?? "").trim();

    // ✅ subject도 text 컬럼
    const subjectText = String(subject ?? "").trim();

    // ✅ prompt 필드는 question과 동일하게 설정 (스키마에 prompt가 필요하므로)
    const prompt = String(question ?? "").trim();

    // ✅ difficulty를 int로 변환 (스키마에서 int이므로)
    const difficultyMap: Record<string, number> = {
      easy: 1,
      medium: 2,
      hard: 3,
    };
    const difficultyInt = difficultyMap[String(difficulty).toLowerCase()] ?? 2;

    // ✅ answer_index는 int
    const answer_index = Number(answerIndex ?? 0);

    // ✅ id 생성 (없으면 자동 생성)
    const id = body.id ?? `problem-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

    // 스키마에 맞게 insert
    const insertData: any = {
      id,
      grade: gradeNum, // 현재 스키마는 int이므로 숫자로 변환
      subject: subjectText,
      category: categoryText,
      question_type: categoryText, // category와 동일하게 설정
      difficulty: difficultyInt,
      prompt,
      content,
      answer_index,
      explanation: String(explanation ?? "").trim(),
      source: "manual", // 수동 저장된 문제
    };

    // ✅ content_hash와 created_by는 스키마에 추가되면 아래 주석 해제
    // insertData.content_hash = content_hash;
    // insertData.created_by = auth.user?.id ?? null;

    const { error } = await supabase
      .from("problems")
      .insert(insertData);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ ok: true, id });
  } catch (error: any) {
    console.error("문제 저장 오류:", error);
    return NextResponse.json(
      { error: error.message ?? "문제 저장 실패" },
      { status: 500 }
    );
  }
}

