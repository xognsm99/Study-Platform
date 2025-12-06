"use client";

type Props = {
  total: number;
  correct: number;
  wrong: number;
  grade: string;
  subject: string;
  category: string;
};

function subjectLabel(subject: string) {
  if (subject === "english") return "영어";
  if (subject === "math") return "수학";
  return subject;
}

function categoryLabel(category: string) {
  switch (category) {
    case "midterm":
      return "중간";
    case "final":
      return "기말";
    case "vocab":
      return "어휘";
    case "grammar":
      return "문법";
    case "reading":
      return "독해";
    case "writing":
      return "서술";
    default:
      return category;
  }
}

// ✅ 지금 바로 A~E 등급 적용
function calcRank(scorePct: number) {
  if (scorePct >= 90) return "A";
  if (scorePct >= 80) return "B";
  if (scorePct >= 70) return "C";
  if (scorePct >= 60) return "D";
  return "E";
}

export default function ResultCard({
  total,
  correct,
  wrong,
  grade,
  subject,
  category,
}: Props) {
  const subjText = subjectLabel(subject);
  const catText = categoryLabel(category);

  const safeTotal = Math.max(total, 1);
  const scorePct = Math.round((correct / safeTotal) * 100);
  const rank = calcRank(scorePct);

  return (
    <div className="rounded-2xl border bg-white p-6 shadow-sm text-slate-900">
      <div className="mb-4 text-xs text-gray-500">
        {grade} · {subjText} · {catText}
      </div>

      <h2 className="mb-4 text-lg font-bold">학습 결과</h2>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-xl border bg-white p-4">
          <div className="text-xs text-gray-500">정답</div>
          <div className="mt-1 text-2xl font-bold">{correct}</div>
        </div>

        <div className="rounded-xl border bg-white p-4">
          <div className="text-xs text-gray-500">총 문항</div>
          <div className="mt-1 text-2xl font-bold">{total}</div>
        </div>

        <div className="rounded-xl border bg-white p-4">
          <div className="text-xs text-gray-500">점수</div>
          <div className="mt-1 text-2xl font-bold">{scorePct}</div>
        </div>
      </div>

      <div className="mt-4 rounded-xl border bg-white p-4">
        <div className="text-xs text-gray-500">오답</div>
        <div className="mt-1 text-lg font-semibold">{wrong}</div>
      </div>

      <div className="mt-4 rounded-xl bg-gray-50 p-4">
        <div className="text-xs font-semibold text-gray-600">간이 등급</div>
        <div className="mt-1 text-2xl font-bold">{rank}</div>

        <p className="mt-2 text-sm text-gray-600">
          현재는 점수 기반 간이 등급(A~E)입니다.  
          다음 단계에서 “자주 출제/취약 유형” 기반 세부 배지를 추가합니다.
        </p>
      </div>
    </div>
  );
}
