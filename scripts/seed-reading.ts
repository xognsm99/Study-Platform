import { createClient } from "@supabase/supabase-js";
import { READING_TITLE_DIEGO_SAMPLES } from "../src/data/reading_title_diego_samples";
import {
  CATEGORY,
  SUBJECT_CODE,
  normalizeSubject,
  normalizeGrade,
} from "../src/lib/problem-constants";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
  throw new Error("NEXT_PUBLIC_SUPABASE_URL 환경 변수가 설정되지 않았습니다.");
}

if (!supabaseServiceKey) {
  throw new Error("SUPABASE_SERVICE_ROLE_KEY 환경 변수가 설정되지 않았습니다.");
}

// Service Role Key를 사용하여 관리자 권한으로 클라이언트 생성
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function seedReading() {
  console.log("독해 문제 시드 데이터 입력을 시작합니다...");
  console.log(`총 ${READING_TITLE_DIEGO_SAMPLES.length}개의 문항을 처리합니다.\n`);

  let successCount = 0;
  let errorCount = 0;

  for (const sample of READING_TITLE_DIEGO_SAMPLES) {
    try {
      // 정규화 적용
      const normalizedSubject = normalizeSubject(sample.subject) ?? SUBJECT_CODE.ENGLISH;
      const normalizedGrade = normalizeGrade(sample.grade) ?? sample.grade;
      const normalizedCategory = sample.category === "reading" ? CATEGORY.READING : sample.category;

      const explanationText = String(sample.explanation ?? "").trim();
      const baseContent: any = sample.content ?? {};
      const rawBase: any = baseContent.raw ?? baseContent ?? {};
      const content = {
        ...baseContent,
        explanation: explanationText || baseContent.explanation || undefined,
        raw: {
          ...rawBase,
          해설: explanationText || rawBase["해설"] || rawBase.해설 || null,
        },
      };

      const { error } = await supabase
        .from("problems")
        .upsert(
          {
            id: sample.id,
            grade: normalizedGrade,
            subject: normalizedSubject,
            category: normalizedCategory,
            question_type: sample.question_type,
            difficulty: sample.difficulty,
            prompt: sample.prompt,
            content,
            answer_index: sample.answer_index,
            explanation: sample.explanation,
            publisher: sample.publisher,
            source: sample.source,
          },
          {
            onConflict: "id",
          }
        );

      if (error) {
        console.error(`❌ ${sample.id} 실패:`, error.message);
        errorCount++;
      } else {
        console.log(`✅ ${sample.id} 성공`);
        successCount++;
      }
    } catch (err) {
      console.error(`❌ ${sample.id} 예외 발생:`, err);
      errorCount++;
    }
  }

  console.log("\n=== 시드 데이터 입력 완료 ===");
  console.log(`✅ 성공: ${successCount}개`);
  console.log(`❌ 실패: ${errorCount}개`);
  console.log(`📊 총 처리: ${READING_TITLE_DIEGO_SAMPLES.length}개`);
  console.log(`\n📝 inserted/updated rows: ${successCount}개`);
}

seedReading()
  .then(() => {
    console.log("\n시드 스크립트가 성공적으로 완료되었습니다.");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n시드 스크립트 실행 중 오류 발생:", error);
    process.exit(1);
  });

