import Link from "next/link";

export default function HomePage() {
  return (
    <div className="mx-auto max-w-5xl p-6">
      {/* ✅ 오른쪽 카드 삭제하고, 왼쪽 카드만 단독으로 */}
      <div className="rounded-2xl border bg-white p-8 text-slate-900 shadow-sm">
        {/* ✅ 제목/설명 텍스트 색 명시 */}
        <h1 className="text-2xl font-bold">
          시험 대비, 오늘부터 가볍게
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          AI 기반 문제 생성으로 매번 새로운 연습문제를 제공합니다.
        </p>

        <div className="mt-6 flex gap-3">
          <Link
            href="/student"
            className="rounded-md bg-blue-600 px-4 py-2 text-sm text-white"
          >
            학생
          </Link>

          <button
            className="rounded-md border px-4 py-2 text-sm text-slate-400"
            disabled
          >
            선생님(준비중)
          </button>
        </div>
      </div>
    </div>
  );
}
