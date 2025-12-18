"use client";

import { useMemo, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import QuizClient from "@/components/QuizClient";
import type { ProblemItem } from "@/components/QuizClient";
import { ui } from "@/lib/ui";

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

const primaryBtn =
  "w-full h-12 rounded-xl text-base font-semibold flex items-center justify-center transition";

const solidBtn =
  `${primaryBtn} bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800`;

const outlineBtn =
  `${primaryBtn} border border-blue-600 text-blue-700 bg-white hover:bg-blue-50 active:bg-blue-100`;

const SEOUL_GU = [
  "강남구", "강동구", "강북구", "강서구", "관악구", "광진구", "구로구", "금천구", "노원구", "도봉구",
  "동대문구", "동작구", "마포구", "서대문구", "서초구", "성동구", "성북구", "송파구", "양천구", "영등포구",
  "용산구", "은평구", "종로구", "중구", "중랑구",
];

const GYEONGGI_CITIES = [
  "수원시", "성남시", "고양시", "용인시", "부천시", "안산시", "안양시", "남양주시", "화성시", "평택시",
  "의정부시", "시흥시", "파주시", "김포시", "광주시", "광명시", "군포시", "오산시", "이천시", "양주시",
  "구리시", "안성시", "포천시", "의왕시", "하남시", "여주시", "동두천시", "과천시",
  "가평군", "양평군", "연천군",
];

const UNIT_OPTIONS = [
  "1~3단원",
  "중간고사",
  "4~6단원",
  "기말고사",
  "종합평가",
] as const;

export default function StudentPage() {
  const router = useRouter();

  // grade 값은 항상 DB용 코드값("1","2","3")으로 유지, UI에는 라벨로 표시
  const [grade, setGrade] = useState<string>("2");
  const [subject, setSubject] = useState<string>("영어");
  const [unitRange, setUnitRange] = useState<string>(UNIT_OPTIONS[0]);
  const [selectedGroups, setSelectedGroups] = useState<Set<string>>(
    new Set(["vocab", "grammar", "reading", "dialogue"])
  );
  const [started, setStarted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [problems, setProblems] = useState<ProblemItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  // 지역/학교 선택 state
  const [regionGroup, setRegionGroup] = useState<string>("서울");
  const [subRegion, setSubRegion] = useState<string>("");
  const [schoolQuery, setSchoolQuery] = useState<string>("");
  const [schoolOptions, setSchoolOptions] = useState<
    { code: string; name: string; location?: string; kind?: string; address?: string }[]
  >([]);
  const [selectedSchool, setSelectedSchool] = useState<{
    code: string;
    name: string;
    location?: string;
    kind?: string;
    address?: string;
  } | null>(null);
  const [schoolLoading, setSchoolLoading] = useState(false);

  // 세부 지역 옵션
  const subRegionOptions = useMemo(() => {
    if (regionGroup === "서울") return SEOUL_GU;
    if (regionGroup === "경기") return GYEONGGI_CITIES;
    return [];
  }, [regionGroup]);

  const canProceed = useMemo(() => grade === "2" && selectedGroups.size > 0, [grade, selectedGroups]);

  // 학교 검색 useEffect (디바운스)
  useEffect(() => {
    let t: any = null;
    if (schoolQuery.trim().length < 2) {
      setSchoolOptions([]);
      return;
    }

    t = setTimeout(async () => {
      try {
        setSchoolLoading(true);
        const qs = new URLSearchParams({
          group: regionGroup,
          q: schoolQuery.trim(),
          size: "30",
        });
        if (subRegion) qs.set("sub", subRegion);
        const res = await fetch(`/api/neis-schools?${qs.toString()}`);
        const data = await res.json();
        setSchoolOptions(Array.isArray(data?.items) ? data.items : []);
      } catch {
        setSchoolOptions([]);
      } finally {
        setSchoolLoading(false);
      }
    }, 300);

    return () => clearTimeout(t);
  }, [regionGroup, subRegion, schoolQuery]);

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
      sp.set("unit", encodeURIComponent(unitRange));

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
          {/* ✅ 2열 그리드 = 모바일에서도 3줄(=3x3 느낌) */}
          <div className="grid grid-cols-2 gap-3">
            {/* 1) 지역 */}
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-800">
                지역
              </label>
              <select
                value={regionGroup}
                onChange={(e) => {
                  setRegionGroup(e.target.value);
                  setSubRegion("");
                  setSelectedSchool(null);
                  setSchoolQuery("");
                  setSchoolOptions([]);
                }}
                className={`${ui.control} pr-10`}
              >
                {["서울", "경기", "충청", "전라", "경상", "강원", "제주"].map(
                  (g) => (
                    <option key={g} value={g}>
                      {g}
                    </option>
                  )
                )}
              </select>
            </div>

            {/* 2) 세부지역 */}
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-800">
                {regionGroup === "서울"
                  ? "구"
                  : regionGroup === "경기"
                    ? "시/군"
                    : "세부지역"}
              </label>
              <select
                value={subRegion}
                onChange={(e) => {
                  setSubRegion(e.target.value);
                  setSelectedSchool(null);
                  setSchoolQuery("");
                  setSchoolOptions([]);
                }}
                className={`${ui.control} pr-10`}
                disabled={subRegionOptions.length === 0}
              >
                <option value="">
                  {subRegionOptions.length ? "전체" : "해당 없음"}
                </option>
                {subRegionOptions.map((x) => (
                  <option key={x} value={x}>
                    {x}
                  </option>
                ))}
              </select>
            </div>

            {/* 3) 학교(선택 표시용) */}
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-800">
                학교
              </label>
              <button
                type="button"
                className={`${ui.control} text-left flex items-center justify-between`}
                onClick={() => {
                  // 학교 검색 입력으로 스크롤/포커스
                  document
                    .getElementById("schoolSearchInput")
                    ?.scrollIntoView({ behavior: "smooth", block: "center" });
                  setTimeout(
                    () => document.getElementById("schoolSearchInput")?.focus(),
                    150
                  );
                }}
              >
                <span className="truncate">
                  {selectedSchool?.name ? selectedSchool.name : "학교 선택"}
                </span>
                <span className="text-slate-400">▾</span>
              </button>
            </div>

            {/* 4) 단원/시험범위 */}
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-800">
                단원
              </label>
              <select
                className={`${ui.control} pr-10`}
                value={unitRange}
                onChange={(e) => setUnitRange(e.target.value)}
              >
                {UNIT_OPTIONS.map((op) => (
                  <option key={op} value={op}>
                    {op}
                  </option>
                ))}
              </select>
            </div>

            {/* 5) 학년 */}
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-800">
                학년
              </label>
              <select
                className={`${ui.control} pr-10`}
                value={grade}
                onChange={(e) => setGrade(e.target.value)}
              >
                {GRADES.map((g) => (
                  <option key={g.value} value={g.value}>
                    {g.label}
                  </option>
                ))}
              </select>
            </div>

            {/* 6) 과목 */}
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-800">
                과목
              </label>
              <input className={ui.control} value={subject} readOnly />
            </div>
          </div>

          {/* 학교 검색 입력 (그리드 밖에서 풀폭) */}
          <div className="mt-4">
            <label className="block text-sm font-medium mb-2 text-gray-800">
              학교 검색
            </label>
            <input
              id="schoolSearchInput"
              className={ui.control}
              value={schoolQuery}
              onChange={(e) => {
                setSelectedSchool(null);
                setSchoolQuery(e.target.value);
              }}
              placeholder="학교 이름 2글자 이상 입력 (예: 대동, 신어)"
            />
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              검색 결과에서 선택하면 위 '학교' 칸에 적용됩니다.
            </p>

            {/* 검색 결과 리스트(풀폭) */}
            {schoolOptions.length > 0 && (
              <div className="mt-2 rounded-lg border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900/40 overflow-hidden">
                {schoolOptions.slice(0, 10).map((s) => (
                  <button
                    key={s.code}
                    type="button"
                    className="w-full px-3 py-2 text-left hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors"
                    onClick={() => {
                      setSelectedSchool(s);
                      setSchoolQuery(s.name);
                      setSchoolOptions([]);
                    }}
                  >
                    <div className="font-medium text-gray-900 dark:text-slate-100">
                      {s.name}
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      {s.address || s.location || s.code}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          <button
            type="button"
            className={`${outlineBtn} mt-3`}
            onClick={() => {
              const params = new URLSearchParams({
                grade: grade,
                subject: subject,
                region: regionGroup,
                sub: subRegion,
                school: selectedSchool?.code ?? "",
                unit: encodeURIComponent(unitRange),
              });
              router.push(`/student/vocab-game?${params.toString()}`);
            }}
          >
            단어 퀴즈 시작
          </button>

          <div className="block mt-4">
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
            className={`${solidBtn} mt-2 disabled:cursor-not-allowed disabled:bg-gray-300 disabled:hover:bg-gray-300`}
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

