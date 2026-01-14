"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase-browser";
import { ScreenCard, ScreenTitle } from "@/components/ui/ScreenCard";

type CategoryStats = {
  category: string;
  total: number;
  correct: number;
  wrong: number;
  accuracy: number;
};

type SubCategoryStats = {
  subCategory: string;
  total: number;
  correct: number;
  wrong: number;
  accuracy: number;
};

type WeaknessData = {
  userName: string;
  school: string;
  grade: string;
  subject: string;
  totalQuestions: number;
  correctAnswers: number;
  wrongAnswers: number;
  overallAccuracy: number;
  categoryStats: CategoryStats[];
  subCategoryStats: SubCategoryStats[];
};

export default function WeaknessPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<WeaknessData | null>(null);

  useEffect(() => {
    const fetchWeaknessData = async () => {
      try {
        setLoading(true);
        setError(null);

        const supabase = supabaseBrowser();
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          setError("로그인이 필요합니다.");
          setLoading(false);
          return;
        }

        // API 호출하여 약점 분석 데이터 가져오기
        const res = await fetch(`/api/student-weakness?userId=${user.id}`);
        const json = await res.json();

        if (!json.ok) {
          setError(json.error || "데이터를 불러오지 못했습니다.");
          setLoading(false);
          return;
        }

        setData(json.data);
        setLoading(false);
      } catch (e: any) {
        console.error("weakness fetch error:", e);
        setError(e?.message || "알 수 없는 오류");
        setLoading(false);
      }
    };

    fetchWeaknessData();
  }, []);

  if (loading) {
    return (
      <div className="px-1 pt-3 pb-24">
        <div className="px-5 mb-6">
          <ScreenTitle>내 약점 분석</ScreenTitle>
        </div>
        <ScreenCard>
          <div className="text-center text-sm text-gray-500">데이터를 분석하는 중...</div>
        </ScreenCard>
      </div>
    );
  }

  if (error) {
    return (
      <div className="px-1 pt-3 pb-24">
        <div className="px-5 mb-6">
          <ScreenTitle>내 약점 분석</ScreenTitle>
        </div>
        <ScreenCard>
          <div className="text-center">
            <div className="text-sm text-red-600 mb-4">{error}</div>
            <button
              onClick={() => router.back()}
              className="group relative overflow-hidden px-6 h-10 rounded-[16px] text-sm font-semibold transition-all duration-500 ease-out select-none active:scale-[0.97]"
              style={{
                background: "linear-gradient(145deg, #1e40af 0%, #1e3a8a 50%, #172554 100%)",
                boxShadow: "0 8px 24px -4px rgba(30,64,175,0.5), 0 0 0 1px rgba(255,255,255,0.1) inset",
                color: "white",
              }}
            >
              <span className="relative z-10">돌아가기</span>
            </button>
          </div>
        </ScreenCard>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  return (
    <div className="px-1 pt-3 pb-24">
      <div className="px-5 mb-6">
        <ScreenTitle>내 약점 분석</ScreenTitle>
      </div>

      {/* 기본 정보 */}
      <ScreenCard className="mb-4">
        <div className="text-sm font-semibold text-gray-900 mb-2">{data.userName}님의 학습 분석</div>
        <div className="text-xs text-gray-500">
          {data.school} · {data.grade} · {data.subject}
        </div>
      </ScreenCard>

      {/* 전체 통계 */}
      <ScreenCard className="mb-4">
        <div className="text-sm font-semibold text-gray-900 mb-3">전체 학습 현황</div>

        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="rounded-xl bg-[#eff6ff] p-3 text-center">
            <div className="text-xs text-gray-600 mb-1">총 문항</div>
            <div className="text-xl font-bold text-[#1e40af]">{data.totalQuestions}</div>
          </div>
          <div className="rounded-xl bg-[#dcfce7] p-3 text-center">
            <div className="text-xs text-gray-600 mb-1">정답</div>
            <div className="text-xl font-bold text-[#16a34a]">{data.correctAnswers}</div>
          </div>
          <div className="rounded-xl bg-[#fee2e2] p-3 text-center">
            <div className="text-xs text-gray-600 mb-1">오답</div>
            <div className="text-xl font-bold text-[#dc2626]">{data.wrongAnswers}</div>
          </div>
        </div>

        <div className="rounded-xl bg-[#dbeafe] p-4 text-center">
          <div className="text-sm text-gray-700 mb-1">전체 정답률</div>
          <div className="text-3xl font-extrabold text-[#1e40af]">{data.overallAccuracy}%</div>
        </div>
      </ScreenCard>

      {/* 대분류 카테고리 분석 (어휘/문법/대화문/본문) */}
      <ScreenCard className="mb-4">
        <div className="text-sm font-semibold text-gray-900 mb-3">카테고리별 분석</div>

        <div className="space-y-3">
          {data.categoryStats.map((cat) => (
            <div key={cat.category} className="rounded-xl border border-[#93c5fd] bg-white p-3">
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm font-semibold text-gray-900">{cat.category}</div>
                <div className="text-sm font-bold text-[#3b82f6]">{cat.accuracy}%</div>
              </div>

              <div className="flex items-center gap-2 text-xs text-gray-600 mb-2">
                <span>총 {cat.total}문항</span>
                <span>·</span>
                <span className="text-green-600">정답 {cat.correct}</span>
                <span>·</span>
                <span className="text-red-600">오답 {cat.wrong}</span>
              </div>

              {/* 진행 바 */}
              <div className="h-2 w-full rounded-full bg-gray-100">
                <div
                  className="h-2 rounded-full bg-[#3b82f6]"
                  style={{ width: `${cat.accuracy}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </ScreenCard>

      {/* 소분류 카테고리 분석 */}
      <ScreenCard className="mb-4">
        <div className="text-sm font-semibold text-gray-900 mb-3">세부 유형별 분석</div>

        <div className="space-y-2">
          {data.subCategoryStats
            .sort((a, b) => a.accuracy - b.accuracy) // 정답률 낮은 순으로 정렬
            .map((sub) => (
              <div
                key={sub.subCategory}
                className={`rounded-xl border p-3 ${
                  sub.accuracy < 60
                    ? "border-red-200 bg-red-50"
                    : sub.accuracy < 80
                    ? "border-yellow-200 bg-yellow-50"
                    : "border-green-200 bg-green-50"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="text-sm font-medium text-gray-900">{sub.subCategory}</div>
                  <div
                    className={`text-sm font-bold ${
                      sub.accuracy < 60
                        ? "text-red-600"
                        : sub.accuracy < 80
                        ? "text-yellow-600"
                        : "text-green-600"
                    }`}
                  >
                    {sub.accuracy}%
                  </div>
                </div>
                <div className="text-xs text-gray-600">
                  {sub.total}문항 중 {sub.correct}개 정답
                </div>
              </div>
            ))}
        </div>
      </ScreenCard>

      {/* 추천 학습 */}
      <ScreenCard>
        <div className="text-sm font-semibold text-gray-900 mb-3">💡 추천 학습</div>

        <div className="rounded-xl border border-[#93c5fd] bg-[#eff6ff] p-4">
          <div className="text-sm text-gray-700 mb-2">
            정답률이 낮은 유형을 집중 학습하세요!
          </div>
          <ul className="text-xs text-gray-600 space-y-1">
            {data.subCategoryStats
              .filter((sub) => sub.accuracy < 70)
              .slice(0, 3)
              .map((sub) => (
                <li key={sub.subCategory} className="flex items-center gap-2">
                  <span className="text-red-500">•</span>
                  <span>
                    <strong>{sub.subCategory}</strong> ({sub.accuracy}%) - 추가 학습 필요
                  </span>
                </li>
              ))}
          </ul>
        </div>
      </ScreenCard>
    </div>
  );
}
