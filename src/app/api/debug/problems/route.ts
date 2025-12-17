import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const result: any = {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || null,
    total: null,
    vocab: null,
    errors: {},
  };

  // Supabase 클라이언트 생성
  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    result.errors.missingEnv = "SUPABASE_URL 또는 SUPABASE_SERVICE_ROLE_KEY가 설정되지 않았습니다.";
    return NextResponse.json(result, { status: 500 });
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { persistSession: false },
  });

  // 1) total count: grade='2' and subject='english'
  const { count: totalCount, error: totalError } = await supabase
    .from("problems")
    .select("id", { count: "exact", head: true })
    .eq("grade", "2")
    .eq("subject", "english");

  result.total = totalCount;
  if (totalError) {
    result.errors.total = totalError.message;
  }

  // 2) vocab count: grade='2' and subject='english' and category='vocab'
  const { count: vocabCount, error: vocabError } = await supabase
    .from("problems")
    .select("id", { count: "exact", head: true })
    .eq("grade", "2")
    .eq("subject", "english")
    .eq("category", "vocab");

  result.vocab = vocabCount;
  if (vocabError) {
    result.errors.vocab = vocabError.message;
  }

  return NextResponse.json(result);
}

