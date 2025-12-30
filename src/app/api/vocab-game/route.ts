import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({ ok: true, route: "/api/vocab-game" });
}

export async function POST(req: Request) {
  try {
    // env 체크
    const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_ANON_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!url || !serviceKey) {
      return NextResponse.json(
        { ok: false, error: "Supabase env vars are missing" },
        { status: 500 }
      );
    }

    // ✅ service_role 로 서버에서만 읽기 (RLS 우회)
    const supabase = createClient(url, serviceKey, { auth: { persistSession: false } });

    const { grade, subject, limit = 10 } = await req.json().catch(() => ({}));

    const g = String(grade ?? "").trim();
    const s = String(subject ?? "").trim();
    const lim = Math.min(Math.max(Number(limit) || 10, 1), 50);

    if (!g || !s) {
      return NextResponse.json(
        { ok: false, error: "grade/subject 필요" },
        { status: 400 }
      );
    }

    // ✅ DB에서 "퀴즈_키패드"만 뽑아오도록 고정
    const { data, error, count } = await supabase
      .from("problems")
      .select("id, grade, subject, qtype, content, created_at", {
        count: "exact",
      })
      .eq("grade", g)
      .eq("subject", s)
      .eq("qtype", "퀴즈_키패드")
      .order("created_at", { ascending: false })
      .limit(lim);

    if (error) {
      return NextResponse.json(
        { ok: false, error: error.message, detail: error },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      table: "problems",
      count: count ?? data?.length ?? 0,
      items: data ?? [],
    });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message ?? String(e) },
      { status: 500 }
    );
  }
}
