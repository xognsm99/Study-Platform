"use client";

import Link from "next/link";
import { useParams } from "next/navigation";

export default function ParentPage() {
  const params = useParams();
  const locale = (params?.locale as string) || "ko";

  return (
    <div className="min-h-screen bg-sky-50 dark:bg-sky-50 p-4 sm:p-8">
      <div className="mx-auto max-w-3xl">
        <div className="rounded-2xl border-2 border-slate-200 bg-white p-8 shadow-md">
          <h1 className="text-2xl font-bold text-slate-900 mb-4">학부모 모드</h1>
          <p className="text-sm text-slate-600 mb-6">
            학부모 기능은 준비 중입니다.
          </p>
          <Link
            href={`/${locale}/student/setup`}
            className="inline-block rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
          >
            학생 설정으로 돌아가기
          </Link>
        </div>
      </div>
    </div>
  );
}

