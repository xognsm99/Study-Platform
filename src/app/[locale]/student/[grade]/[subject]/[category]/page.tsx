import QuizClient from "@/components/QuizClient";
import { normalizeCategory } from "@/lib/utils/constants";

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ locale: string; grade: string; subject: string; category: string }>;
}) {
  const { grade, subject, category: rawCategory } = await params;

  const decodedGrade = decodeURIComponent(grade);
  
  // ✅ 카테고리 정규화 (레거시 값 → 표준 value)
  const normalizedCategory = normalizeCategory(rawCategory);

  return (
    <div className="mx-auto max-w-4xl p-6">
      <QuizClient
        grade={decodedGrade}
        subject={subject}
        category={normalizedCategory}
      />
    </div>
  );
}

