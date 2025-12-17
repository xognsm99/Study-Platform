import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

export async function POST(req: Request) {
  const supabase = await supabaseServer();

  // ✅ 사용자 정보 확인
  let userId: string | null = null;
  try {
    const { data: auth } = await supabase.auth.getUser();
    userId = auth.user?.id ?? null;
  } catch (e) {
    console.error("[submit-answer] auth.getUser 실패:", e);
  }

  const { problemId, selectedIndex } = await req.json();

  // ✅ 문제 정보는 항상 조회 (정답 여부 계산용)
  let answerIndex = -1;
  let isCorrect = false;

  try {
    const { data: problem, error: pErr } = await supabase
      .from("problems")
      .select("id, content")
      .eq("id", problemId)
      .single();

    if (pErr || !problem) {
      console.error("[submit-answer] 문제 조회 실패:", pErr);
    } else {
      answerIndex = (problem.content as any).answerIndex as number;
      isCorrect = selectedIndex === answerIndex;

      // ✅ 로그인한 사용자에 대해서만 진행률/통계 저장
      if (userId) {
        try {
          // progress insert
          const { error: insErr } = await supabase.from("user_progress").insert({
            user_id: userId,
            problem_id: problem.id,
            is_correct: isCorrect,
            selected_index: selectedIndex,
          });

          if (insErr) throw insErr;
        } catch (e) {
          console.error("[submit-answer] user_progress insert 실패:", e);
        }

        try {
          // stats upsert (단순 계산 MVP)
          const { data: stats } = await supabase
            .from("user_stats")
            .select("*")
            .eq("user_id", userId)
            .maybeSingle();

          const totalSolved = (stats?.total_solved ?? 0) + 1;
          const correctSolved =
            Math.round(
              ((stats?.accuracy_rate ?? 0) / 100) * (stats?.total_solved ?? 0)
            ) + (isCorrect ? 1 : 0);

          const accuracy =
            totalSolved === 0
              ? 0
              : Number(((correctSolved / totalSolved) * 100).toFixed(2));

          const level = Math.max(1, Math.floor(totalSolved / 50) + 1);

          const { error: upErr } = await supabase.from("user_stats").upsert({
            user_id: userId,
            total_solved: totalSolved,
            accuracy_rate: accuracy,
            level,
            badges: stats?.badges ?? [],
            updated_at: new Date().toISOString(),
          });

          if (upErr) throw upErr;
        } catch (e) {
          console.error("[submit-answer] user_stats upsert 실패:", e);
        }
      } else {
        // 비로그인 사용자는 기록 저장 스킵
        console.log("[submit-answer] 비로그인 사용자 - 진행률 저장 스킵");
      }
    }
  } catch (e) {
    console.error("[submit-answer] 처리 중 오류:", e);
  }

  // ✅ 항상 200 OK 반환 (user_progress 저장 실패/비로그인도 포함)
  return NextResponse.json({
    ok: true,
    isCorrect,
    answerIndex,
    skipped: userId ? undefined : "no_user",
  });
}
