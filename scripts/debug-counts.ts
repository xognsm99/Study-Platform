import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
  throw new Error("NEXT_PUBLIC_SUPABASE_URL 환경 변수가 설정되지 않았습니다.");
}

if (!supabaseServiceKey) {
  throw new Error("SUPABASE_SERVICE_ROLE_KEY 환경 변수가 설정되지 않았습니다.");
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function debugCounts() {
  console.log("=== 문제 데이터 진단 ===\n");

  // 전체 문제 수
  const { count: totalCount, error: totalError } = await supabase
    .from("problems")
    .select("*", { count: "exact", head: true });

  if (totalError) {
    console.error("전체 문제 수 조회 오류:", totalError);
  } else {
    console.log(`📊 전체 문제 수: ${totalCount ?? 0}개\n`);
  }

  // category별 그룹
  const { data: categoryData, error: categoryError } = await supabase
    .from("problems")
    .select("category");

  if (categoryError) {
    console.error("category 조회 오류:", categoryError);
  } else {
    const categoryCounts: Record<string, number> = {};
    categoryData?.forEach((item) => {
      const cat = item.category || "(null)";
      categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
    });
    console.log("📁 category별 분포:");
    Object.entries(categoryCounts)
      .sort((a, b) => b[1] - a[1])
      .forEach(([cat, count]) => {
        console.log(`  ${cat}: ${count}개`);
      });
    console.log();
  }

  // subject별 그룹
  const { data: subjectData, error: subjectError } = await supabase
    .from("problems")
    .select("subject");

  if (subjectError) {
    console.error("subject 조회 오류:", subjectError);
  } else {
    const subjectCounts: Record<string, number> = {};
    subjectData?.forEach((item) => {
      const subj = item.subject || "(null)";
      subjectCounts[subj] = (subjectCounts[subj] || 0) + 1;
    });
    console.log("📚 subject별 분포:");
    Object.entries(subjectCounts)
      .sort((a, b) => b[1] - a[1])
      .forEach(([subj, count]) => {
        console.log(`  ${subj}: ${count}개`);
      });
    console.log();
  }

  // publisher별 그룹
  const { data: publisherData, error: publisherError } = await supabase
    .from("problems")
    .select("publisher");

  if (publisherError) {
    console.error("publisher 조회 오류:", publisherError);
  } else {
    const publisherCounts: Record<string, number> = {};
    publisherData?.forEach((item) => {
      const pub = item.publisher || "(null)";
      publisherCounts[pub] = (publisherCounts[pub] || 0) + 1;
    });
    console.log("🏢 publisher별 분포:");
    Object.entries(publisherCounts)
      .sort((a, b) => b[1] - a[1])
      .forEach(([pub, count]) => {
        console.log(`  ${pub}: ${count}개`);
      });
    console.log();
  }

  // grade별 그룹
  const { data: gradeData, error: gradeError } = await supabase
    .from("problems")
    .select("grade");

  if (gradeError) {
    console.error("grade 조회 오류:", gradeError);
  } else {
    const gradeCounts: Record<string, number> = {};
    gradeData?.forEach((item) => {
      const grd = String(item.grade || "(null)");
      gradeCounts[grd] = (gradeCounts[grd] || 0) + 1;
    });
    console.log("🎓 grade별 분포:");
    Object.entries(gradeCounts)
      .sort((a, b) => {
        const aNum = Number(a[0]) || 0;
        const bNum = Number(b[0]) || 0;
        return aNum - bNum;
      })
      .forEach(([grd, count]) => {
        console.log(`  ${grd}: ${count}개`);
      });
    console.log();
  }

  // 샘플 데이터 확인 (처음 5개)
  const { data: sampleData, error: sampleError } = await supabase
    .from("problems")
    .select("id, category, subject, publisher, grade")
    .limit(5);

  if (sampleError) {
    console.error("샘플 데이터 조회 오류:", sampleError);
  } else {
    console.log("📋 샘플 데이터 (처음 5개):");
    sampleData?.forEach((item, idx) => {
      console.log(
        `  ${idx + 1}. id: ${item.id}, category: ${item.category}, subject: ${item.subject}, publisher: ${item.publisher}, grade: ${item.grade}`
      );
    });
  }
}

debugCounts()
  .then(() => {
    console.log("\n✅ 진단 완료");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ 진단 중 오류 발생:", error);
    process.exit(1);
  });

