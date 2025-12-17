import { createClient } from "@supabase/supabase-js";
import { GIMHAE_SCHOOL_TEXTBOOKS } from "../src/data/gimhae_school_textbooks";

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

async function seedSchoolTextbooks() {
  console.log("김해 중학교 교과서 매핑 시드 데이터 입력을 시작합니다...");
  console.log(`총 ${GIMHAE_SCHOOL_TEXTBOOKS.length}개의 매핑을 처리합니다.\n`);

  let successCount = 0;
  let errorCount = 0;

  for (const textbook of GIMHAE_SCHOOL_TEXTBOOKS) {
    try {
      const { error } = await supabase
        .from("school_textbooks")
        .upsert(
          {
            school_name: textbook.school_name,
            grade: textbook.grade,
            subject: textbook.subject,
            publisher: textbook.publisher,
          },
          {
            onConflict: "school_name,grade,subject",
          }
        );

      if (error) {
        console.error(`❌ ${textbook.school_name} ${textbook.grade}학년 ${textbook.subject} 실패:`, error.message);
        errorCount++;
      } else {
        console.log(`✅ ${textbook.school_name} ${textbook.grade}학년 ${textbook.subject} 성공`);
        successCount++;
      }
    } catch (err) {
      console.error(`❌ ${textbook.school_name} ${textbook.grade}학년 ${textbook.subject} 예외 발생:`, err);
      errorCount++;
    }
  }

  console.log("\n=== 시드 데이터 입력 완료 ===");
  console.log(`✅ 성공: ${successCount}개`);
  console.log(`❌ 실패: ${errorCount}개`);
  console.log(`📊 총 처리: ${GIMHAE_SCHOOL_TEXTBOOKS.length}개`);
  console.log(`\n📝 inserted/updated rows: ${successCount}개`);
}

seedSchoolTextbooks()
  .then(() => {
    console.log("\n시드 스크립트가 성공적으로 완료되었습니다.");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n시드 스크립트 실행 중 오류 발생:", error);
    process.exit(1);
  });

