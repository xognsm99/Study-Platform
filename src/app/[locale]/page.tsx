import Link from "next/link";

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  const btnBase =
    "w-full rounded-xl border border-gray-200 bg-white px-6 py-3 text-base font-semibold text-gray-900 shadow-sm " +
    "transition-colors hover:bg-blue-600 hover:text-white hover:border-blue-600 " +
    "focus:outline-none focus:ring-4 focus:ring-blue-200";

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 text-gray-900">
      <div className="mx-auto max-w-2xl px-6 py-14">
        <div className="rounded-3xl bg-white p-10 shadow-sm ring-1 ring-gray-100">
          <h1 className="text-3xl font-semibold tracking-tight text-gray-900">
            내신 준비, 쇼츠처럼 쉽게
          </h1>
          <p className="mt-3 text-sm text-gray-600">
            최적의 AI 문제 생성 어플
          </p>

          <div className="mt-8 grid grid-cols-2 gap-3">
            <Link
              href={`/${locale}/student`}
              className={
                "w-full rounded-xl bg-blue-600 px-6 py-3 text-base font-semibold text-white shadow-sm " +
                "transition-colors hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-200"
              }
            >
              학생
            </Link>

            <Link
              href="/teacher"
              className={
                "w-full rounded-xl border border-gray-200 bg-white px-6 py-3 text-base font-semibold text-gray-900 shadow-sm " +
                "transition-colors hover:border-blue-500 hover:text-blue-600 " +
                "focus:outline-none focus:ring-4 focus:ring-blue-200"
              }
            >
              선생님
            </Link>
          </div>
          {/* TODO: 나중에 프로필 기반 기능(결제/프리셋 저장/기관 관리) 추가 시 
              역할 선택 후 프로필 확인/생성 단계 추가 가능 */}
        </div>
      </div>
    </div>
  );
}

