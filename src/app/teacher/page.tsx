"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ui } from "@/lib/ui";

const GRADES = [
  { label: "중1 (준비중)", value: 1 },
  { label: "중2", value: 2 },
  { label: "중3 (준비중)", value: 3 },
];

const SUBJECTS = [
  { label: "영어", value: "english" },
  // 국어/사회는 나중에 확장
];

export default function TeacherHomePage() {
  const router = useRouter();

  const [grade, setGrade] = useState<number>(2);
  const [subject, setSubject] = useState<string>("english");

  const canProceed = useMemo(() => grade === 2 && !!subject, [grade, subject]);

  const handleNext = () => {
    if (!canProceed) return;
    const qs = new URLSearchParams({
      grade: String(grade),
      subject,
    });
    router.push(`/teacher/build?${qs.toString()}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      <div className="mx-auto max-w-xl px-6 py-10">
        <h1 className="text-2xl font-bold text-gray-900">선생님 모드</h1>

        <div className="mt-8 space-y-5 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
          <label className="block">
            <span className={ui.label}>학년</span>
            <select
              value={grade}
              onChange={(e) => setGrade(Number(e.target.value))}
              className={`mt-2 ${ui.control} pr-10`}
            >
              {GRADES.map((g) => (
                <option key={g.value} value={g.value}>{g.label}</option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className={ui.label}>과목</span>
            <select
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className={`mt-2 ${ui.control} pr-10`}
            >
              {SUBJECTS.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </label>

          <button
            onClick={handleNext}
            disabled={!canProceed}
            className="mt-2 w-full rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white
                       hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-300"
          >
            20문항 시험지 만들기
          </button>

          {grade !== 2 && (
            <p className="mt-2 text-xs text-gray-500 text-center">
              중2만 이용 가능합니다 (준비중)
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

