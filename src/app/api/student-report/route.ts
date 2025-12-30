import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    // env 체크
    const supabaseUrl = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_ANON_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json(
        { ok: false, error: "Supabase env vars are missing" },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: false },
    });
    const { searchParams } = new URL(req.url);
    const period = searchParams.get("period") || "monthly";
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { ok: false, error: "userId가 필요합니다." },
        { status: 400 }
      );
    }

    // 기간 계산
    const now = new Date();
    let startDate: Date;
    if (period === "weekly") {
      startDate = new Date(now);
      startDate.setDate(now.getDate() - 7);
    } else {
      // monthly
      startDate = new Date(now);
      startDate.setDate(1); // 이번 달 1일
      startDate.setHours(0, 0, 0, 0);
    }

    // 1. 사용자 이름 가져오기 (auth.users의 email 또는 student_profiles)
    const { data: profile } = await supabase
      .from("student_profiles")
      .select("*")
      .eq("user_id", userId)
      .single();

    let userName = "학생";
    if (profile && profile.grade) {
      userName = `${profile.grade} 학생`;
    }

    // 2. game_attempts에서 집계
    const { data: attempts, error: attemptsError } = await supabase
      .from("game_attempts")
      .select("score, correct_count, total_count, created_at")
      .eq("user_id", userId)
      .gte("created_at", startDate.toISOString());

    if (attemptsError) {
      console.error("game_attempts 조회 오류:", attemptsError);
    }

    let points = 0;
    let played = 0;
    let correct = 0;

    if (attempts && attempts.length > 0) {
      for (const attempt of attempts) {
        points += attempt.score || 0;
        played += attempt.total_count || 0;
        correct += attempt.correct_count || 0;
      }
    }

    const accuracyPct = played > 0 ? Math.round((correct / played) * 100) : 0;

    // 3. 생성한 문제 수 (나중에 problems 테이블이 있으면 추가)
    // TODO: problems 테이블에서 created_by = userId인 것 count
    const createdProblems = 0;

    // 4. 월간 목표 (나중에 사용자 설정으로)
    const monthlyGoal = 50;

    return NextResponse.json({
      ok: true,
      data: {
        userName,
        points,
        played,
        correct,
        accuracyPct,
        createdProblems,
        monthlyGoal,
        period,
      },
    });
  } catch (e: any) {
    console.error("student-report API error:", e);
    return NextResponse.json(
      { ok: false, error: e?.message || "Unknown error" },
      { status: 500 }
    );
  }
}
