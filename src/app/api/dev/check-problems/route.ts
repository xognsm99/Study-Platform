// src/app/api/dev/check-problems/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function GET() {
  try {
    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json(
        { error: "Supabase 환경 변수가 설정되지 않았습니다." },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 전체 카운트
    const { count, error: countError } = await supabase
      .from("problems")
      .select("*", { count: "exact", head: true });

    if (countError) {
      return NextResponse.json(
        { error: countError.message },
        { status: 500 }
      );
    }

    // 카테고리별 카운트
    const { data: allProblems, error: dataError } = await supabase
      .from("problems")
      .select("category");

    if (dataError) {
      return NextResponse.json(
        { error: dataError.message },
        { status: 500 }
      );
    }

    const categoryCounts: Record<string, number> = {};
    if (allProblems) {
      allProblems.forEach((p) => {
        const cat = p.category || "unknown";
        categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
      });
    }

    return NextResponse.json({
      problems_count: count ?? 0,
      category_counts: categoryCounts,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "알 수 없는 오류" },
      { status: 500 }
    );
  }
}

