import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

type GameSet = {
  seed: string;
  items: Array<{
    type: "flash4";
    payload: {
      focusWord: string;   // 영단어/숙어
      choices: string[];   // 뜻 4개(한글)
      answerIndex: number; // 0~3
    };
  }>;
};

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function getSupabase() {
  const url =
    process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;

  const serviceKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw new Error(
      `ENV missing: url=${!!url} service=${!!serviceKey}`
    );
  }

  return createClient(url, serviceKey, { auth: { persistSession: false } });
}


export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const seed = searchParams.get("seed") || "today";

    const unitsParam = searchParams.get("units") || "u1";
    const units = unitsParam.split(",").map((s) => s.trim()).filter(Boolean);

    const n = Math.max(1, Math.min(50, Number(searchParams.get("n") || "10")));

    const supabase = getSupabase();

    // ✅ u1~u12 범위에서 단어/숙어(둘 다) 가져오기
    const { data, error } = await supabase
      .from("vocab_bank")
      .select("term, meaning_ko, unit, kind")
      .in("unit", units);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const rows = (data ?? []).filter((r) => r.term && r.meaning_ko);
    if (rows.length < 4) {
      return NextResponse.json(
        {
          error: `데이터가 부족합니다: 현재 ${rows.length}개(최소 4개 필요)`,
          units,
          count: rows.length
        },
        { status: 400 }
      );
    }

    // ✅ 문제 n개 랜덤 선택
    const picked = shuffle(rows).slice(0, Math.min(n, rows.length));

    // ✅ 오답 풀(뜻) — 같은 단원들 내에서만
    const meaningPool = rows.map((r) => String(r.meaning_ko));

    const items: GameSet["items"] = picked.map((r) => {
      const correct = String(r.meaning_ko);

      // 오답 3개 뽑기(정답 제외)
      const distractors = shuffle(
        meaningPool.filter((m) => m !== correct)
      ).slice(0, 3);

      // 데이터가 아주 적어 3개 못 채우면(거의 없음) 중복 방지로 채움
      while (distractors.length < 3) {
        const extra = meaningPool.find((m) => m !== correct && !distractors.includes(m));
        if (!extra) break;
        distractors.push(extra);
      }

      const choices = shuffle([correct, ...distractors]).slice(0, 4);
      const answerIndex = choices.indexOf(correct);

      return {
        type: "flash4",
        payload: {
          focusWord: String(r.term),
          choices,
          answerIndex: answerIndex < 0 ? 0 : answerIndex,
        },
      };
    });

    const gameSet: GameSet = { seed, items };
    return NextResponse.json(gameSet);
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "Unknown error" }, { status: 500 });
  }
}
