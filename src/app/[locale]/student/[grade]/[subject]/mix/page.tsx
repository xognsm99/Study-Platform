import QuizClient from "@/components/QuizClient";

export default async function MixPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; grade: string; subject: string }>;
  searchParams: Promise<{ categories?: string }>;
}) {
  const { grade, subject } = await params;
  const { categories } = await searchParams;
  
  const decodedGrade = decodeURIComponent(grade);
  
  // categories를 배열로 파싱 (쉼표로 구분)
  const categoriesArray = categories 
    ? categories.split(",").map(c => c.trim()).filter(Boolean)
    : undefined;

  return (
    <div className="mx-auto max-w-4xl p-6">
      <QuizClient
        grade={decodedGrade}
        subject={subject}
        category="mix"        
      />
    </div>
  );
}

