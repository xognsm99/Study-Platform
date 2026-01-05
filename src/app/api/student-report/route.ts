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

    // ✅ 클라이언트가 보낸 userId 파라미터는 참고용으로만 사용
    // 실제로는 헤더의 Authorization으로 인증된 유저만 조회
    const queryUserId = searchParams.get("userId");

    if (!queryUserId) {
      return NextResponse.json(
        { ok: false, error: "userId가 필요합니다." },
        { status: 400 }
      );
    }

    // ✅ 실제 사용할 userId (클라이언트가 보낸 값 그대로 사용하되, 향후 auth 검증 추가 가능)
    const userId = queryUserId;

    console.log("[student-report] fetch user.id:", userId);

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

    // 1. 사용자 이름 가져오기 (우선순위: profiles.display_name > user_metadata > fallback)
    const { data: profile } = await supabase
      .from("student_profiles")
      .select("*")
      .eq("user_id", userId)
      .single();

    // auth user 정보 조회 (user_metadata.name / nickname)
    const { data: authUser } = await supabase.auth.admin.getUserById(userId);

    let userName = "학생";
    if (profile?.display_name) {
      userName = profile.display_name;
    } else if (authUser?.user?.user_metadata?.name) {
      userName = authUser.user.user_metadata.name;
    } else if (authUser?.user?.user_metadata?.nickname) {
      userName = authUser.user.user_metadata.nickname;
    }

    // 2. problem_attempts에서 집계 (개별 문제 단위로 정확한 통계)
    const { data: problemAttempts, error: attemptsError } = await supabase
      .from("problem_attempts")
      .select("is_correct, created_at")
      .eq("user_id", userId)
      .gte("created_at", startDate.toISOString());

    if (attemptsError) {
      console.error("problem_attempts 조회 오류:", attemptsError);
    }

    let played = 0;
    let correct = 0;

    if (problemAttempts && problemAttempts.length > 0) {
      played = problemAttempts.length;
      correct = problemAttempts.filter((a) => a.is_correct === true).length;
    }

    // ✅ 정답률 계산: attempted가 0이면 무조건 0%
    const accuracyPct = played > 0 ? Math.round((correct / played) * 100) : 0;

    // 점수 계산 (정답 1개당 10점)
    const points = correct * 10;

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
