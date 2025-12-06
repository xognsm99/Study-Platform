import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

export async function POST(req: Request) {
  try {
    const supabase = await supabaseServer();
    const { data: auth } = await supabase.auth.getUser();
    const user = auth.user;

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { problemId, selectedIndex } = await req.json();

    const { data: problem, error: pErr } = await supabase
      .from("problems")
      .select("id, content")
      .eq("id", problemId)
      .single();

    if (pErr || !problem) throw pErr ?? new Error("Problem not found");

    const answerIndex = (problem.content as any).answerIndex as number;
    const isCorrect = selectedIndex === answerIndex;

    // progress insert
    const { error: insErr } = await supabase.from("user_progress").insert({
      user_id: user.id,
      problem_id: problem.id,
      is_correct: isCorrect,
      selected_index: selectedIndex,
    });

    if (insErr) throw insErr;

    // stats upsert (단순 계산 MVP)
    const { data: stats } = await supabase
      .from("user_stats")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    const totalSolved = (stats?.total_solved ?? 0) + 1;
    const correctSolved = Math.round(
      ((stats?.accuracy_rate ?? 0) / 100) * (stats?.total_solved ?? 0)
    ) + (isCorrect ? 1 : 0);

    const accuracy = totalSolved === 0
      ? 0
      : Number(((correctSolved / totalSolved) * 100).toFixed(2));

    const level = Math.max(1, Math.floor(totalSolved / 50) + 1);

    const { error: upErr } = await supabase.from("user_stats").upsert({
      user_id: user.id,
      total_solved: totalSolved,
      accuracy_rate: accuracy,
      level,
      badges: stats?.badges ?? [],
      updated_at: new Date().toISOString(),
    });

    if (upErr) throw upErr;

    return NextResponse.json({ isCorrect, answerIndex });
  } catch (e: any) {
    return NextResponse.json(
      { error: e.message ?? "Submit failed" },
      { status: 500 }
    );
  }
}
