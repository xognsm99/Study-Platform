import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await supabaseServer();
    const { data: auth } = await supabase.auth.getUser();
    const user = auth.user;

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data, error } = await supabase
      .from("user_stats")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    if (error) throw error;

    return NextResponse.json({
      stats: data ?? {
        total_solved: 0,
        accuracy_rate: 0,
        level: 1,
        badges: [],
      },
    });
  } catch (e: any) {
    return NextResponse.json(
      { error: e.message ?? "Stats failed" },
      { status: 500 }
    );
  }
}
