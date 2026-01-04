import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const supabase = await supabaseServer();

    // ✅ 로그인 유저 확인 (body userId 절대 믿지 않음)
    const { data: auth, error: authErr } = await supabase.auth.getUser();
    const userId = auth?.user?.id ?? null;

    if (authErr) {
      return NextResponse.json(
        { ok: false, error: `auth.getUser failed: ${authErr.message}` },
        { status: 401 }
      );
    }

    if (!userId) {
      return NextResponse.json(
        { ok: false, error: "로그인이 필요합니다." },
        { status: 401 }
      );
    }

    const body = await req.json();

    // ✅ body 파싱 (alias 지원)
    const gameSetId = body.gameSetId ?? body.game_set_id ?? null;
    const score = body.score;
    const correctCount = body.correctCount ?? body.correct_count;
    const totalCount = body.totalCount ?? body.total_count;
    const timeSpentSec = body.timeSpentSec ?? body.time_spent_sec;

    // ✅ 필수값 체크
    if (
      score === undefined ||
      correctCount === undefined ||
      totalCount === undefined ||
      timeSpentSec === undefined
    ) {
      return NextResponse.json(
        {
          ok: false,
          error: "필수 파라미터가 누락되었습니다.",
          keys: Object.keys(body),
        },
        { status: 400 }
      );
    }

    // ✅ 실제 INSERT
    const insertData = {
      user_id: userId,
      game_set_id: gameSetId,
      score: Number(score),
      correct_count: Number(correctCount),
      total_count: Number(totalCount),
      time_spent_sec: Number(timeSpentSec),
    };

    const { data, error } = await supabase
      .from("game_attempts")
      .insert(insertData)
      .select("*")
      .single();

    if (error) {
      return NextResponse.json(
        { ok: false, error: error.message, details: error.details, code: error.code },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true, data });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message || "Unknown error" },
      { status: 500 }
    );
  }
}
