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

    // 3. 약점 분석: user_progress에서 최근 30일 qtype별 정답률 (attempts >= 8)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(now.getDate() - 30);

    const { data: progressData } = await supabase
      .from("user_progress")
      .select("problem_id, is_correct")
      .eq("user_id", userId)
      .gte("created_at", thirtyDaysAgo.toISOString());

    // problem_id로 qtype 조회
    const problemIds = (progressData || []).map((p) => p.problem_id);
    const { data: problems } = await supabase
      .from("problems")
      .select("id, content")
      .in("id", problemIds);

    const qtypeStats: Record<string, { attempts: number; correct: number }> = {};
    (progressData || []).forEach((progress) => {
      const problem = (problems || []).find((p) => p.id === progress.problem_id);
      const qtype = (problem?.content as any)?.qtype || "unknown";

      if (!qtypeStats[qtype]) {
        qtypeStats[qtype] = { attempts: 0, correct: 0 };
      }
      qtypeStats[qtype].attempts += 1;
      if (progress.is_correct) {
        qtypeStats[qtype].correct += 1;
      }
    });

    const weakQtypes = Object.entries(qtypeStats)
      .filter(([_, stats]) => stats.attempts >= 8)
      .map(([qtype, stats]) => ({
        qtype,
        acc: Math.round((stats.correct / stats.attempts) * 100),
        attempts: stats.attempts,
      }))
      .sort((a, b) => a.acc - b.acc)
      .slice(0, 3);

    // 4. 리더보드 (TODO: 실제 리더보드 테이블이 없으므로 mock)
    // user_stats에서 상위 5명 가져오기 (임시)
    const { data: topUsers } = await supabase
      .from("user_stats")
      .select("user_id, total_solved, accuracy_rate")
      .order("total_solved", { ascending: false })
      .limit(5);

    const leaderboardWorld = (topUsers || []).map((u, idx) => ({
      name: `User${idx + 1}`,
      points: u.total_solved * 10,
      rank: idx + 1,
    }));

    const leaderboardLocal = leaderboardWorld; // TODO: 지역 필터링

    // 5. 생성한 문제 수 (나중에 problems 테이블이 있으면 추가)
    const createdProblems = 0;

    // 6. 월간 목표 (나중에 사용자 설정으로)
    const monthlyGoal = 50;

    // 7. 추천 학습 생성
    const todayPlan = [];
    if (weakQtypes.length > 0) {
      const weakest = weakQtypes[0];
      todayPlan.push({
        title: "오늘 10문항",
        desc: `${weakest.qtype} 유형 10문항만 풀고 마무리하세요.`,
      });
      todayPlan.push({
        title: "약점 보완",
        desc: `최근 오답이 많은 유형: ${weakest.qtype} (정답률 ${weakest.acc}%) → 내일 15문항 추천`,
      });
    } else {
      todayPlan.push({
        title: "오늘 10문항",
        desc: "아무 유형이나 10문항만 풀고 마무리하세요.",
      });
      todayPlan.push({
        title: "약점 보완",
        desc: "데이터가 충분히 쌓이면 약점 분석이 표시됩니다.",
      });
    }
    todayPlan.push({
      title: "루틴",
      desc: "3일 연속 학습을 만들면 점수가 안정적으로 오릅니다.",
    });

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
        weakQtypes,
        todayPlan,
        leaderboardWorld,
        leaderboardLocal,
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
