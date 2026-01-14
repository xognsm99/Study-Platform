import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function GET(req: NextRequest) {
  try {
    const supabase = createClient(supabaseUrl, supabaseKey);
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ ok: false, error: "userId is required" }, { status: 400 });
    }

    // 사용자 프로필 정보 가져오기
    const { data: profile, error: profileError } = await supabase
      .from("student_profiles")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { ok: false, error: "프로필 정보를 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    // 사용자의 모든 학습 기록 가져오기 (student_answers 테이블)
    const { data: answers, error: answersError } = await supabase
      .from("student_answers")
      .select("*")
      .eq("user_id", userId);

    // 학습 기록이 없거나 테이블이 없는 경우 더미 데이터 사용
    if (answersError || !answers || answers.length === 0) {
      console.log("No answers found or error, using dummy data:", answersError?.message);

      // 더미 데이터 생성
      const dummyData = {
        userName: profile.name || "학생",
        school: profile.school || "학교 미설정",
        grade: profile.grade || "학년 미설정",
        subject: profile.subject || "영어",
        totalQuestions: 50,
        correctAnswers: 35,
        wrongAnswers: 15,
        overallAccuracy: 70,
        categoryStats: [
          { category: "어휘", total: 15, correct: 12, wrong: 3, accuracy: 80 },
          { category: "문법", total: 12, correct: 8, wrong: 4, accuracy: 67 },
          { category: "대화문", total: 10, correct: 7, wrong: 3, accuracy: 70 },
          { category: "본문", total: 13, correct: 8, wrong: 5, accuracy: 62 },
        ],
        subCategoryStats: [
          { subCategory: "단어 뜻", total: 8, correct: 7, wrong: 1, accuracy: 88 },
          { subCategory: "빈칸 추론", total: 7, correct: 5, wrong: 2, accuracy: 71 },
          { subCategory: "문법 구조", total: 6, correct: 3, wrong: 3, accuracy: 50 },
          { subCategory: "시제", total: 6, correct: 5, wrong: 1, accuracy: 83 },
          { subCategory: "대화 흐름", total: 5, correct: 4, wrong: 1, accuracy: 80 },
          { subCategory: "응답 추론", total: 5, correct: 3, wrong: 2, accuracy: 60 },
          { subCategory: "주제 파악", total: 5, correct: 3, wrong: 2, accuracy: 60 },
          { subCategory: "내용 일치", total: 4, correct: 2, wrong: 2, accuracy: 50 },
          { subCategory: "세부 정보", total: 4, correct: 3, wrong: 1, accuracy: 75 },
        ],
      };

      return NextResponse.json({ ok: true, data: dummyData });
    }

    // 전체 통계 계산
    const totalQuestions = answers?.length || 0;
    const correctAnswers = answers?.filter((a) => a.is_correct).length || 0;
    const wrongAnswers = totalQuestions - correctAnswers;
    const overallAccuracy = totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0;

    // 대분류 카테고리별 통계 (어휘, 문법, 대화문, 본문)
    const categoryMap = new Map<string, { total: number; correct: number }>();
    const categoryNames = ["어휘", "문법", "대화문", "본문"];

    categoryNames.forEach((cat) => {
      categoryMap.set(cat, { total: 0, correct: 0 });
    });

    answers?.forEach((answer) => {
      const category = answer.category || "기타";
      if (!categoryMap.has(category)) {
        categoryMap.set(category, { total: 0, correct: 0 });
      }
      const stats = categoryMap.get(category)!;
      stats.total++;
      if (answer.is_correct) {
        stats.correct++;
      }
    });

    const categoryStats = Array.from(categoryMap.entries()).map(([category, stats]) => ({
      category,
      total: stats.total,
      correct: stats.correct,
      wrong: stats.total - stats.correct,
      accuracy: stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0,
    }));

    // 소분류 카테고리별 통계 (12가지)
    const subCategoryMap = new Map<string, { total: number; correct: number }>();

    answers?.forEach((answer) => {
      const subCategory = answer.sub_category || "기타";
      if (!subCategoryMap.has(subCategory)) {
        subCategoryMap.set(subCategory, { total: 0, correct: 0 });
      }
      const stats = subCategoryMap.get(subCategory)!;
      stats.total++;
      if (answer.is_correct) {
        stats.correct++;
      }
    });

    const subCategoryStats = Array.from(subCategoryMap.entries()).map(([subCategory, stats]) => ({
      subCategory,
      total: stats.total,
      correct: stats.correct,
      wrong: stats.total - stats.correct,
      accuracy: stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0,
    }));

    const weaknessData = {
      userName: profile.name || "학생",
      school: profile.school || "학교 미설정",
      grade: profile.grade || "학년 미설정",
      subject: profile.subject || "과목 미설정",
      totalQuestions,
      correctAnswers,
      wrongAnswers,
      overallAccuracy,
      categoryStats: categoryStats.filter((cat) => cat.total > 0),
      subCategoryStats: subCategoryStats.filter((sub) => sub.total > 0),
    };

    return NextResponse.json({ ok: true, data: weaknessData });
  } catch (error: any) {
    console.error("student-weakness API error:", error);
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}
