import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

type GameSet = {
  seed: string;
  items: Array<{
    type: "flash4";
    payload: {
      focusWord: string;   // 영단어/숙어
      choices: string[];   // 뜻 4개 (한글/영영 섞여도 문자열이면 OK)
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

function norm(v: any): string {
  return String(v ?? "").replace(/\s+/g, " ").trim();
}

function uniqNonEmpty(list: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of list) {
    const v = norm(raw);
    if (!v) continue;
    if (seen.has(v)) continue;
    seen.add(v);
    out.push(v);
  }
  return out;
}

function getSupabase() {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw new Error(`ENV missing: url=${!!url} service=${!!serviceKey}`);
  }

  return createClient(url, serviceKey, { auth: { persistSession: false } });
}

function pickChoices4(pool: string[], correct: string): { choices: string[]; answerIndex: number } {
  const c = norm(correct);
  if (!c) {
    // 정답이 비어있으면 안전하게 처리(거의 발생 안함)
    const fallback = shuffle(pool).slice(0, 4);
    return { choices: fallback, answerIndex: 0 };
  }

  // 오답 후보: 정답 제외 + 중복 제거
  const candidates = pool.filter((m) => m !== c);

  // 3개 뽑고(가능하면)
  let distractors = shuffle(candidates).slice(0, 3);

  // 혹시 3개 못 채우면 채우기(중복 방지)
  if (distractors.length < 3) {
    for (const m of candidates) {
      if (distractors.length >= 3) break;
      if (!distractors.includes(m)) distractors.push(m);
    }
  }

  // 그래도 부족하면(풀 자체가 부족) pool에서라도 채우기
  if (distractors.length < 3) {
    for (const m of pool) {
      if (distractors.length >= 3) break;
      if (m !== c && !distractors.includes(m)) distractors.push(m);
    }
  }

  const mixed = shuffle([c, ...distractors]);
  const choices = mixed.slice(0, 4);

  let answerIndex = choices.indexOf(c);

  // 정답이 잘려나간 극단 케이스 방지
  if (answerIndex < 0) {
    choices[0] = c;
    answerIndex = 0;
  }

  return { choices, answerIndex };
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const seed = searchParams.get("seed") || "today";

    const unitsParam = searchParams.get("units") || "u1";
    const units = unitsParam.split(",").map((s) => s.trim()).filter(Boolean);

    const n = Math.max(1, Math.min(50, Number(searchParams.get("n") || "10")));

    const supabase = getSupabase();

    // ✅ meaning_en 추가 (여기 핵심)
    const { data, error } = await supabase
      .from("vocab_bank")
      .select("term, meaning_ko, meaning_en, unit, kind")
      .in("unit", units);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // term + meaning_ko는 기본(한글 모드 fallback을 위해)
    const rows = (data ?? []).filter((r: any) => norm(r.term) && norm(r.meaning_ko));

    // 풀 만들기 (중복 제거 + 빈값 제거)
    const koPool = uniqNonEmpty(rows.map((r: any) => r.meaning_ko));
    const enPool = uniqNonEmpty(
      rows
        .map((r: any) => r.meaning_en)
        .filter((v: any) => norm(v))
    );

    // koPool이 최소 4개는 있어야 4지선다 가능
    if (koPool.length < 4) {
      return NextResponse.json(
        {
          error: `데이터가 부족합니다(한글 뜻 4개 미만): koPool=${koPool.length}`,
          units,
          count: rows.length,
        },
        { status: 400 }
      );
    }

    // ✅ 문제 n개 랜덤 선택
    const picked = shuffle(rows).slice(0, Math.min(n, rows.length));

    const items: GameSet["items"] = picked.map((r: any) => {
      const term = norm(r.term);
      const ko = norm(r.meaning_ko);
      const en = norm(r.meaning_en);

      // ✅ 영영 모드 조건: meaning_en 있고, enPool이 4개 이상일 때만
      const canEn = !!en && enPool.length >= 4;

      // ✅ 40% 확률로 영영 모드
      const useEn = canEn && Math.random() < 0.4;

      const correct = useEn ? en : ko;
      const pool = useEn ? enPool : koPool;

      const { choices, answerIndex } = pickChoices4(pool, correct);

      return {
        type: "flash4",
        payload: {
          focusWord: term,
          choices,
          answerIndex,
        },
      };
    });

    const gameSet: GameSet = { seed, items };
    return NextResponse.json(gameSet);
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message ?? "Unknown error" },
      { status: 500 }
    );
  }
}
