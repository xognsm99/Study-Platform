import Link from "next/link";
import { ENGLISH_CATEGORIES } from "@/lib/utils/constants";

export default async function SubjectPage({
  params,
}: {
  params: Promise<{ grade: string; subject: string }>;
}) {
  const { grade, subject } = await params;
  const decodedGrade = decodeURIComponent(grade);

  // ✅ 영어는 카테고리 선택으로
  if (subject === "english") {
    return (
      <div className="mx-auto max-w-4xl p-6 text-gray-900">
        <h1 className="text-2xl font-bold mb-2">영어 카테고리 선택</h1>
        <p className="text-sm text-gray-600 mb-5">{decodedGrade} · 영어</p>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {ENGLISH_CATEGORIES.map((c) => (
            <Link
              key={c.key}
              href={`/student/${encodeURIComponent(decodedGrade)}/english/${c.key}`}
              className="rounded-xl border bg-white p-4 text-center text-sm font-medium hover:bg-gray-50"
            >
              {c.label}
            </Link>
          ))}
        </div>

        <div className="mt-6">
          <Link
            href={`/student/${encodeURIComponent(decodedGrade)}`}
            className="text-sm text-blue-600"
          >
            ← 과목 선택으로
          </Link>
        </div>
      </div>
    );
  }

  // ✅ 나머지는 MVP 준비중
  return (
    <div className="mx-auto max-w-3xl p-6 text-gray-900">
      <div className="rounded-2xl border bg-white p-6">
        <h2 className="text-lg font-semibold">준비중</h2>
        <p className="mt-2 text-sm text-gray-600">
          이 과목은 아직 준비중입니다.
        </p>
        <Link
          href={`/student/${encodeURIComponent(decodedGrade)}`}
          className="mt-4 inline-block text-sm text-blue-600"
        >
          ← 과목 선택으로
        </Link>
      </div>
    </div>
  );
}
