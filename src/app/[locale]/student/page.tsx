"use client";

import { useMemo, useState } from "react";
import QuizClient from "@/components/QuizClient";
import type { ProblemItem } from "@/components/QuizClient";

const GRADES = [
  { label: "중1 (준비중)", value: "1" },
  { label: "중2", value: "2" },
  { label: "중3 (준비중)", value: "3" },
] as const;

const GROUPS = [
  { key: "vocab", label: "어휘" },
  { key: "grammar", label: "문법" },
  { key: "reading", label: "본문" },
  { key: "dialogue", label: "대화문" },
] as const;

export default function StudentPage() {
  // grade 값은 항상 DB용 코드값("1","2","3")으로 유지, UI에는 라벨로 표시
  const [grade, setGrade] = useState<string>("2");
  const [selectedGroups, setSelectedGroups] = useState<Set<string>>(
    new Set(["vocab", "grammar", "reading", "dialogue"])
  );
  const [started, setStarted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [problems, setProblems] = useState<ProblemItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  const canProceed = useMemo(() => grade === "2" && selectedGroups.size > 0, [grade, selectedGroups]);

  const handleGroupToggle = (groupKey: string) => {
    const newSet = new Set(selectedGroups);
    if (newSet.has(groupKey)) {
      newSet.delete(groupKey);
    } else {
      newSet.add(groupKey);
    }
    setSelectedGroups(newSet);
  };

  const handleStart = async () => {
    if (!canProceed) return;

    setLoading(true);
    setError(null);

    try {
      // DB로 전송하는 grade 값은 항상 코드값("2" 등)
      const gradeDbValue = grade || "2";

      // 선택된 그룹을 카테고리 값으로 변환 (vocab/grammar/reading/dialogue)
      const categories = Array.from(selectedGroups);

      // ✅ /api/student/random에는 쿼리스트링으로 grade/subject/categories를 CSV 형태로 전달
      const sp = new URLSearchParams();
      sp.set("grade", gradeDbValue);
      sp.set("subject", "english");
      sp.set("categories", categories.join(","));

      const res = await fetch(`/api/student/random?${sp.toString()}`, {
        method: "GET",
        cache: "no-store",
      });

      const data = await res.json();

      // API에서 에러가 반환된 경우 (0개로 처리하지 않고 에러로 처리)
      if (!data?.ok) {
        if (process.env.NODE_ENV === "development") {
          console.error("❌ 문제 로드 API 에러:", data);
          console.error("❌ 에러 메시지:", data?.error || data?.errorMessage);
          if (data?.errorDetails) {
            console.error("❌ 에러 상세:", data.errorDetails);
          }
        }
        
        // RLS 에러 또는 권한 문제인 경우 특별 처리
        if (data?.error?.includes("권한 문제") || data?.error?.includes("RLS")) {
          throw new Error(
            data.error || 
            "권한 문제(RLS) 또는 환경변수 Supabase 프로젝트 불일치. 관리자에게 문의하세요."
          );
        }
        
        // errorMessage가 있으면 우선 사용, 없으면 error 사용
        const errorMsg = data?.errorMessage || data?.error || "문제 로드 실패";
        throw new Error(errorMsg);
      }

      // problems가 없거나 빈 배열인 경우
      if (!data.problems || data.problems.length === 0) {
        // 에러 상세 정보가 있으면 로그로만 출력
        if (process.env.NODE_ENV === "development" && data?.errorDetails) {
          console.error("문제 로드 실패 상세:", data.errorDetails);
        }
        throw new Error(
          "문제를 불러올 수 없습니다. " +
          "(디버그: /api/debug/problems?grade=2&subject=english&category=vocab 확인)"
        );
      }

      setProblems(data.problems);
      setStarted(true);
    } catch (err: any) {
      setError(err.message ?? "문제를 불러오는 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  if (started && problems.length > 0) {
    const categoryForView =
      selectedGroups.size === 1 ? Array.from(selectedGroups)[0] : "vocab";
    return (
      <div className="mx-auto max-w-4xl p-6">
        <QuizClient
          grade={grade}
          subject="english"
          category={categoryForView}
          initialProblems={problems}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      <div className="mx-auto max-w-xl px-6 py-10">
        <h1 className="text-2xl font-bold text-gray-900">학생 모드</h1>

        <div className="mt-8 space-y-5 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
          <label className="block">
            <span className="text-sm font-medium text-gray-800">학년</span>
            <select
              value={grade}
              onChange={(e) => setGrade(e.target.value)}
              className="mt-2 w-full rounded-lg border px-3 py-2 text-sm transition-colors border-gray-200 bg-gray-100 text-gray-900 focus:border-gray-400 focus:outline-none dark:border-gray-300 dark:bg-gray-200 dark:text-gray-900"
              >
              {GRADES.map((g) => (
                <option key={g.value} value={g.value}>{g.label}</option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="text-sm font-medium text-gray-800">과목</span>
            <div className="mt-2 w-full rounded-lg border px-3 py-2 text-sm border-gray-200 bg-gray-100 text-gray-900">
              영어
            </div>
          </label>

          <div className="block">
            <span className="text-sm font-medium text-gray-800">문제 유형 선택</span>
            <div className="mt-2 grid grid-cols-2 gap-3">
              {GROUPS.map((group) => (
                <label
                  key={group.key}
                  className="flex items-center space-x-2 rounded-lg border px-3 py-2 cursor-pointer transition-colors border-gray-200 hover:bg-gray-50"
                >
                  <input
                    type="checkbox"
                    checked={selectedGroups.has(group.key)}
                    onChange={() => handleGroupToggle(group.key)}
                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-900">{group.label}</span>
                </label>
              ))}
            </div>
          </div>

          <button
            onClick={handleStart}
            disabled={!canProceed || loading}
            className="mt-2 w-full rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white
                       hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-300"
          >
            {loading ? "문제 로딩 중..." : "20문항 풀기 시작"}
          </button>

          {grade !== "2" && (
            <p className="mt-2 text-xs text-gray-500 text-center">
              현재는 중2만 이용 가능합니다(준비중)
            </p>
          )}

          {error && (
            <div className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">
              {error}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

