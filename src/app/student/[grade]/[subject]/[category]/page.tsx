import QuizClient from "@/components/QuizClient";

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ grade: string; subject: string; category: string }>;
}) {
  const { grade, subject, category } = await params;

  const decodedGrade = decodeURIComponent(grade);

  return (
    <div className="mx-auto max-w-4xl p-6">
      <QuizClient
        grade={decodedGrade}
        subject={subject}
        category={category}
      />
    </div>
  );
}
