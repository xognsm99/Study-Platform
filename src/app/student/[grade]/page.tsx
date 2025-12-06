import Link from "next/link";
import { SUBJECTS } from "@/lib/utils/constants";

export default async function GradePage({
  params,
}: {
  params: Promise<{ grade: string }>;
}) {
  const { grade } = await params;
  const decodedGrade = decodeURIComponent(grade);

  return (
    <div className="mx-auto max-w-4xl p-6 text-gray-900">
      <h1 className="text-2xl font-bold mb-2">과목 선택</h1>
      <p className="text-sm text-gray-600 mb-5">
        {decodedGrade} 과목을 선택하세요
      </p>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {SUBJECTS.map((s) => (
          <Link
            key={s.key}
            href={`/student/${encodeURIComponent(decodedGrade)}/${s.key}`}
            className="rounded-xl border bg-white p-4 text-center text-sm font-medium hover:bg-gray-50"
          >
            {s.label}
          </Link>
        ))}
      </div>

      <div className="mt-6">
        <Link href="/student" className="text-sm text-blue-600">
          ← 학년 선택으로
        </Link>
      </div>
    </div>
  );
}
