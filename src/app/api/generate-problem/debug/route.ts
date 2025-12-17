import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

export async function GET() {
  try {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json({
        ok: false,
        error: "환경 변수 없음",
        hasUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        hasKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const { data, error, count } = await supabase
      .from("problems")
      .select("id, grade, subject, category, difficulty, content", { count: "exact" });

    if (error) {
      return NextResponse.json({
        ok: false,
        error: error.message,
        code: error.code,
        details: error.details,
      });
    }

    // 카테고리별 통계
    const stats: Record<string, number> = {};
    const sampleCategories: string[] = [];

    (data || []).forEach((row: any) => {
      const cat = String(row.category || "").trim();
      stats[cat] = (stats[cat] || 0) + 1;
      if (sampleCategories.length < 10) {
        sampleCategories.push(cat);
      }
    });

    // content 구조 샘플
    const sampleContent = data && data.length > 0 ? data[0].content : null;

    return NextResponse.json({
      ok: true,
      totalCount: count ?? data?.length ?? 0,
      actualRows: data?.length ?? 0,
      categoryStats: stats,
      sampleCategories,
      sampleContent,
      firstRow: data && data.length > 0 ? {
        id: data[0].id,
        grade: data[0].grade,
        subject: data[0].subject,
        category: data[0].category,
        hasContent: !!data[0].content,
        contentType: typeof data[0].content,
      } : null,
    });
  } catch (e: any) {
    return NextResponse.json({
      ok: false,
      error: e?.message || "unknown error",
      stack: e?.stack,
    });
  }
}

