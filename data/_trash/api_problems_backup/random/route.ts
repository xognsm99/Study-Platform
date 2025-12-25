import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

type Bucket = "vocab" | "grammar" | "dialogue" | "reading";

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error(
      "Missing env: NEXT_PUBLIC_SUPABASE_URL and (SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY)"
    );
  }
  return createClient(url, key);
}

function safeStr(v: any) {
  return String(v ?? "").trim();
}

function parseCategories(sp: URLSearchParams): Bucket[] {
  const all = sp.getAll("categories").map((s) => s.trim()).filter(Boolean);
  const raw = all.length > 0 ? all : safeStr(sp.get("categories")).split(",");

  const norm = raw
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s) => {
      if (s === "body") return "reading";
      return s;
    })
    .filter(
      (s): s is Bucket =>
        s === "vocab" || s === "grammar" || s === "dialogue" || s === "reading"
    );

  return norm.length ? norm : ["vocab", "grammar", "dialogue", "reading"];
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function inferBucket(row: any): Bucket {
  const content = row?.content ?? {};
  const raw = content?.raw ?? {};
  const qtype = safeStr(raw?.qtype ?? raw?.["qtype"] ?? content?.qtype ?? "");

  if (qtype.includes("문법")) return "grammar";
  if (qtype.includes("대화")) return "dialogue";
  if (qtype.includes("본문") || qtype.includes("독해")) return "reading";
  if (qtype.includes("어휘")) return "vocab";

  const t = safeStr(content?.type ?? row?.category ?? "");
  if (t === "body") return "reading";
  if (t === "reading") return "reading";
  if (t === "dialogue") return "dialogue";
  if (t === "grammar") return "grammar";
  return "vocab";
}

function buildItem(row: any) {
  const content = row?.content ?? {};
  const raw = content?.raw ?? {};

  const passage = safeStr(
    content?.passage ??
      content?.stem ??
      raw?.["지문"] ??
      raw?.["본문"] ??
      raw?.passage ??
      raw?.body ??
      ""
  );

  const question = safeStr(
    row?.question ??
      content?.question ??
      raw?.question ??
      raw?.["문제"] ??
      raw?.["질문"] ??
      content?.prompt ??
      ""
  );

  let choices: string[] = [];

  if (Array.isArray(row?.choices) && row.choices.length) {
    choices = row.choices.map((c: any) => safeStr(c));
  } else if (Array.isArray(content?.choices) && content.choices.length) {
    choices = content.choices.map((c: any) => safeStr(c));
  } else if (Array.isArray(raw?.options) && raw.options.length) {
    choices = raw.options.map((c: any) => safeStr(c));
  } else {
    const b1 = safeStr(raw?.["보기1"] ?? raw?.choice1);
    const b2 = safeStr(raw?.["보기2"] ?? raw?.choice2);
    const b3 = safeStr(raw?.["보기3"] ?? raw?.choice3);
    const b4 = safeStr(raw?.["보기4"] ?? raw?.choice4);
    const b5 = safeStr(raw?.["보기5"] ?? raw?.choice5);
    const cand = [b1, b2, b3, b4, b5].filter(Boolean);
    if (cand.length) choices = cand;
  }

  if (choices.length !== 5) {
    const filled = [...choices];
    while (filled.length < 5) filled.push("");
    choices = filled.slice(0, 5);
  }

  let answerNo = Number(
    raw?.["정답번호"] ??
      raw?.answerNo ??
      raw?.answer ??
      content?.answerNo ??
      (typeof row?.answerIndex === "number" ? row.answerIndex + 1 : undefined)
  );

  if (!Number.isFinite(answerNo) || answerNo < 1 || answerNo > 5) {
    const ai = Number(content?.answerIndex ?? row?.answerIndex);
    if (Number.isFinite(ai) && ai >= 0 && ai <= 4) answerNo = ai + 1;
  }

  const answerIndex = Number.isFinite(answerNo)
    ? Math.max(0, Math.min(4, answerNo - 1))
    : 0;

  const explanation = safeStr(
    raw?.["해설"] ?? content?.explanation ?? "해설이 제공되지 않았습니다."
  );

  const explanationWrong = safeStr(
    raw?.["오답해설"] ?? content?.explanationWrong ?? ""
  );

  return {
    id: row?.id,
    type: inferBucket(row),
    passage: passage || undefined,
    question,
    choices,
    answerIndex,
    explanation,
    explanationWrong: explanationWrong || undefined,
    content,
  };
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const sp = url.searchParams;

    const grade = safeStr(sp.get("grade"));
    const subject = safeStr(sp.get("subject"));

    const rawLimit = Number(sp.get("limit"));
    const total =
      Number.isFinite(rawLimit) && rawLimit > 0 ? rawLimit : 20;

    const wantTotal = Math.max(20, total);
    const cats = parseCategories(sp);

    if (!grade || !subject) {
      return NextResponse.json(
        { ok: false, errorMessage: "Missing grade/subject", errorDetails: { grade, subject } },
        { status: 400 }
      );
    }

    const base = Math.floor(wantTotal / cats.length);
    let rem = wantTotal - base * cats.length;

    const plan = cats.map((c) => {
      const n = base + (rem > 0 ? 1 : 0);
      rem = Math.max(0, rem - 1);
      return { bucket: c, n };
    });

    const supabase = getSupabase();

    const { data, error } = await supabase
      .from("problems")
      .select("id, content")
      .eq("grade", grade)
      .eq("subject", subject)
      .limit(5000);

    if (error) {
      return NextResponse.json(
        { ok: false, errorMessage: error.message, errorDetails: error },
        { status: 500 }
      );
    }

    const rows = Array.isArray(data) ? data : [];
    const pools: Record<Bucket, any[]> = {
      vocab: [],
      grammar: [],
      dialogue: [],
      reading: [],
    };

    for (const r of rows) pools[inferBucket(r)].push(r);

    const picked: any[] = [];
    const countsByCategory: Record<string, number> = {};

    for (const p of plan) {
      const pool = shuffle(pools[p.bucket]);
      const take = pool.slice(0, p.n);
      countsByCategory[p.bucket] = take.length;
      picked.push(...take);
      pools[p.bucket] = pool.slice(p.n);
    }

    if (picked.length < wantTotal) {
      const rest = shuffle([
        ...pools.vocab,
        ...pools.grammar,
        ...pools.dialogue,
        ...pools.reading,
      ]);
      picked.push(...rest.slice(0, wantTotal - picked.length));
    }

    const problems = shuffle(picked).slice(0, wantTotal).map(buildItem);

    return NextResponse.json({
      ok: true,
      problems,
      meta: {
        grade,
        subject,
        categories: cats,
        limit: wantTotal,
        countsByCategory,
        totalReturned: problems.length,
      },
    });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, errorMessage: e?.message ?? "Unknown error", errorDetails: String(e) },
      { status: 500 }
    );
  }
}
