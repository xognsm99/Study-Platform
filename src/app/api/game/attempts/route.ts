import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { gameSetId, score, correctCount, totalCount, timeSpentSec, userId } = body;

    if (!userId) {
      return NextResponse.json(
        { ok: false, error: "로그인이 필요합니다." },
        { status: 401 }
      );
    }

    if (score === undefined || correctCount === undefined || totalCount === undefined || timeSpentSec === undefined) {
      return NextResponse.json(
        { ok: false, error: "필수 파라미터가 누락되었습니다." },
        { status: 400 }
      );
    }

    // gameSetId는 선택적 (mock 데이터의 경우 null)
    const insertData: any = {
      user_id: userId,
      score,
      correct_count: correctCount,
      total_count: totalCount,
      time_spent_sec: timeSpentSec,
    };

    if (gameSetId) {
      insertData.game_set_id = gameSetId;
    }

    const { data, error } = await supabase
      .from("game_attempts")
      .insert(insertData)
      .select()
      .single();

    if (error) {
      console.error("Game attempt save error:", error);
      return NextResponse.json(
        { ok: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true, data });
  } catch (e: any) {
    console.error("Game attempt API error:", e);
    return NextResponse.json(
      { ok: false, error: e?.message || "Unknown error" },
      { status: 500 }
    );
  }
}

