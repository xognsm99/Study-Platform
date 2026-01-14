import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function POST(req: NextRequest) {
  try {
    const supabase = createClient(supabaseUrl, supabaseKey);
    const body = await req.json();

    const {
      userId,
      questionId,
      category,
      subCategory,
      isCorrect,
      userAnswer,
      correctAnswer,
    } = body;

    if (!userId) {
      return NextResponse.json({ ok: false, error: "userId is required" }, { status: 400 });
    }

    // student_answers 테이블에 저장
    const { data, error } = await supabase.from("student_answers").insert({
      user_id: userId,
      question_id: questionId,
      category: category,
      sub_category: subCategory,
      is_correct: isCorrect,
      user_answer: userAnswer,
      correct_answer: correctAnswer,
    });

    if (error) {
      console.error("Error saving answer:", error);
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, data });
  } catch (error: any) {
    console.error("save-answer API error:", error);
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}
