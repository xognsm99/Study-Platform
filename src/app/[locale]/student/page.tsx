"use client";

import { useMemo, useState, useEffect } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import QuizClient from "@/components/QuizClient";
import type { ProblemItem } from "@/components/QuizClient";
import { ui } from "@/lib/ui";
import SchoolSearch from "@/components/SchoolSearch";
import StudentProfileCard from "@/components/StudentProfileCard";
import { getMyProfile, upsertMyProfile, isProfileComplete, type StudentProfile } from "@/lib/profile";
import { supabaseBrowser } from "@/lib/supabase-browser";
import StudentHomeShell from "@/components/queezy/StudentHomeShell";
import StudentProfileFormShell from "@/components/queezy/StudentProfileFormShell";
import PurpleSelect from "@/components/queezy/PurpleSelect";
import { ScreenCard, ScreenTitle } from "@/components/ui/ScreenCard";
import UnitMultiSelect from "@/components/UnitMultiSelect";
import { parseQuizScope, examToUnits } from "@/lib/quiz/scope";


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

// 세부지역 옵션 맵
const SUBREGION_OPTIONS: Record<string, string[]> = {
  "서울": ["전체"],
  // ✅ 경기도에 인천 추가
  "경기": ["전체", "경기도", "인천광역시"],
  "전라": ["전체", "전라북도", "전라남도", "광주광역시"],
  "충청": ["전체", "충청북도", "충청남도", "대전광역시", "세종특별자치시"],
  // ✅ 경상에 울릉도 추가
  "경상": [
    "전체",
    "경상북도",
    "경상남도",
    "부산광역시",
    "울산광역시",
    "대구광역시",
    "울릉도",
  ],
  "강원": ["전체", "강원도"],
  "제주": ["전체", "제주특별자치도"],
};

// 단원 옵션 (value와 label 분리)
const UNIT_OPTIONS: Array<{ value: string; label: string }> = [
  { value: "u1", label: "1단원" },
  { value: "u2", label: "2단원" },
  { value: "u3", label: "3단원" },
  { value: "u4", label: "4단원" },
  { value: "u5", label: "5단원" },
  { value: "u6", label: "6단원" },
  { value: "u7", label: "7단원" },
  { value: "u8", label: "8단원" },
  { value: "u9", label: "9단원" },
  { value: "u10", label: "10단원" },
  { value: "u11", label: "11단원" },
  { value: "u12", label: "12단원" },
  { value: "mid1", label: "1학기 중간고사" },
  { value: "final1", label: "1학기 기말고사" },
  { value: "mid2", label: "2학기 중간고사" },
  { value: "final2", label: "2학기 기말고사" },
  { value: "overall", label: "종합평가" },
];

export default function StudentPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // locale 추출 (예: /ko/student -> ko)
  const locale = pathname?.split("/")[1] || "ko";

  // URL에서 edit 파라미터 확인
  const editParam = searchParams?.get("edit");
  const [editMode, setEditMode] = useState(false);

  useEffect(() => {
    setEditMode(editParam === "true");
  }, [editParam]);

  // 인증 관련 state
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);

  // 프로필 관련 state
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);

  // grade 값은 항상 DB용 코드값("1","2","3")으로 유지, UI에는 라벨로 표시
  const [grade, setGrade] = useState<string>("2");
  const [subject, setSubject] = useState<string>("영어");
  const [unitRange, setUnitRange] = useState<string>(UNIT_OPTIONS[0].value);

  // 단어 퀴즈 설정
  const [examType, setExamType] = useState<string>(""); // mid1/final1/mid2/final2/overall 또는 빈 문자열(custom)
  const [selectedUnits, setSelectedUnits] = useState<string[]>(["u1"]); // 실제 선택된 단원들

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

  // 인증 상태 확인 및 구독
  useEffect(() => {
    const supabase = supabaseBrowser();

    // 초기 세션 확인
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null);
      setAuthReady(true);
    });

    // 인증 상태 변경 구독
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setAuthReady(true);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // authReady가 true이고 user가 null일 때만 리다이렉트
  useEffect(() => {
    if (!authReady) return;
    if (!user) {
      router.replace(`/auth?next=${encodeURIComponent(`/${locale}/student`)}`);
    }
  }, [authReady, user, locale, router]);

  // 프로필 로드 (user가 준비된 후)
  useEffect(() => {
    if (!authReady) return;

    async function loadProfile() {
      try {
        const data = await getMyProfile(user?.id);
        setProfile(data);
        
        // 프로필이 완성되었는지 확인
        if (isProfileComplete(data)) {
          // 프로필이 완성되었으면 폼 숨김 (단, editMode면 열기), 프로필 정보로 state 초기화
          setShowForm(editMode);
          if (data) {
            setRegionGroup(data.region || "서울");
            setSubRegion(data.district || "");
            setGrade(data.grade || "2");
            setSubject(data.subject || "영어");
            setUnitRange(data.term || UNIT_OPTIONS[0].value);

            // quiz_scope 파싱
            const quizScope = data.quiz_scope || "u1";
            const units = parseQuizScope(quizScope);
            setSelectedUnits(units);

            // exam 타입 판별 (mid1/final1... 이면 설정, 아니면 custom)
            if (["mid1", "final1", "mid2", "final2", "overall"].includes(quizScope)) {
              setExamType(quizScope);
            } else {
              setExamType(""); // custom
            }

            if (data.school && data.school_code) {
              setSelectedSchool({
                code: data.school_code,
                name: data.school,
                location: data.region || undefined,
              });
            }
          }
        } else {
          // 프로필이 없거나 불완전하면 폼 표시
          setShowForm(true);
        }
      } catch (e) {
        console.error("[StudentPage] 프로필 로드 실패:", e);
        // 에러 시에도 폼 표시
        setShowForm(true);
      } finally {
        setProfileLoading(false);
      }
    }
    loadProfile();
  }, [authReady, user?.id, editMode]);

  // 시험 범위 변경 시 units 자동 설정
  useEffect(() => {
    if (examType && examType !== "") {
      const units = examToUnits(examType);
      if (units.length > 0) {
        setSelectedUnits(units);
      }
    }
  }, [examType]);

  // 세부 지역 옵션 (PurpleSelect용으로 변환)
  const subRegionOptions = useMemo(() => {
    const isSeoul = regionGroup === "서울";
    const isGyeonggi = regionGroup === "경기";
    
    if (isSeoul) {
      return SEOUL_GU.map((x) => ({ value: x, label: x }));
    }
    
    if (isGyeonggi) {
      // 경기: 인천, 그리고 나머지 시군 리스트
      return [
        { value: "인천", label: "인천" },
        ...GYEONGGI_CITIES.filter(x => x !== "인천" && x !== "인천광역시").map((x) => ({ value: x, label: x }))
      ];
    }
    
    // 그 외는 SUBREGION_OPTIONS 사용
    const options = SUBREGION_OPTIONS[regionGroup] || [];
    // "전체" 중복 제거
    const fixedOptions = [
      { value: "전체", label: "전체" },
      ...options
        .filter((x) => x !== "전체")
        .map((x) => ({ value: x, label: x }))
    ];
    return fixedOptions;
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

  // 프로필 저장 핸들러
  const handleSaveProfile = async () => {
    if (!selectedSchool) {
      setError("학교를 선택해주세요.");
      return;
    }

    if (!user) {
      setError("로그인이 필요합니다.");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      // quiz_scope 결정: exam이 선택되어 있으면 exam, 아니면 콤마로 구분된 units
      let quizScopeToSave = "";
      if (examType && examType !== "") {
        quizScopeToSave = examType; // "mid1" | "final1" | ...
      } else {
        quizScopeToSave = selectedUnits.join(","); // "u1,u3,u5"
      }

      const result = await upsertMyProfile(
        {
          region: regionGroup,
          district: subRegion || null,
          school: selectedSchool.name,
          school_code: selectedSchool.code ?? null,
          grade: grade,
          subject: subject,
          term: unitRange,
          quiz_scope: quizScopeToSave,
        },
        user.id
      );

      if (result.success) {
        // 저장 성공 시 프로필 다시 로드
        const updatedProfile = await getMyProfile(user.id);
        setProfile(updatedProfile);
        setShowForm(false);
        setEditMode(false);
        // URL에서 edit 파라미터 제거
        router.replace(`/${locale}/student`);
      } else {
        setError(result.error || "프로필 저장에 실패했습니다.");
      }
    } catch (e: any) {
      setError(e?.message || "프로필 저장 중 오류가 발생했습니다.");
    } finally {
      setSaving(false);
    }
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

  const handleStartReadingAB = () => {
    // 프로필/선택값을 쿼리로 넘기고 싶으면 여기서 같이 넘겨도 됨
    // (일단은 페이지 이동만)
    router.push(`/${locale}/student/reading-ab`);
  };

  if (started && problems.length > 0) {
    const categoryForView =
      selectedGroups.size === 1 ? Array.from(selectedGroups)[0] : "vocab";
    return (
      <div className="mx-auto max-w-4xl p-6">
        <QuizClient
  grade={String(grade ?? "")}
  subject="english"
  category={String(categoryForView)}
/>

      </div>
    );
  }

  // 인증 준비 중이거나 로그인 안 된 경우
  if (!authReady || !user) {
    return (
      <div className="px-4 pt-4 pb-24 max-[380px]:px-3 max-[380px]:pt-3">
        <div className="mx-auto w-full max-w-md">
          {/* 로딩 중: 텍스트 없이 빈 스켈레톤 */}
        </div>
      </div>
    );
  }

  // 프로필 로딩 중
  if (profileLoading) {
    return (
      <div className="px-4 pt-4 pb-24 max-[380px]:px-3 max-[380px]:pt-3">
        <div className="mx-auto w-full max-w-md">
          {/* 로딩 중: 텍스트 없이 빈 스켈레톤 */}
        </div>
      </div>
    );
  }

  // 프로필 정보 포맷팅 함수
  const formatProfileInfo = () => {
    if (!profile) return "";
    const parts: string[] = [];
    if (profile.grade) {
      const gradeLabel = profile.grade === "1" ? "중1" : profile.grade === "2" ? "중2" : profile.grade === "3" ? "중3" : `중${profile.grade}`;
      parts.push(gradeLabel);
    }
    if (profile.subject) parts.push(profile.subject);
    return parts.join(" ");
  };

  // Primary 색상 상수 (블루 계열로 통일)
  const PRIMARY_BG = "bg-gradient-to-r from-[#1e40af] to-[#2563eb] hover:from-[#1e3a8a] hover:to-[#1e40af]";
  const PRIMARY_TEXT = "text-[#2563eb]";

  // 공통 입력 필드 스타일 함수
  function fieldClass(selected: boolean) {
    const base =
      "h-12 w-full min-w-0 rounded-full border px-4 text-sm outline-none transition " +
      "max-[380px]:h-10 max-[380px]:text-xs";

    const normal =
      "bg-white border-gray-200 hover:bg-violet-50 hover:border-violet-200 focus:ring-2 focus:ring-violet-200";

    const picked =
      "bg-violet-50 border-violet-300 ring-1 ring-violet-200";

    return `${base} ${selected ? picked : normal}`;
  }
  
  // 지역 옵션
  const regionOptions = [
    { value: "서울", label: "서울" },
    { value: "경기", label: "경기" },
    { value: "충청", label: "충청" },
    { value: "전라", label: "전라" },
    { value: "경상", label: "경상" },
    { value: "강원", label: "강원" },
    { value: "제주", label: "제주" },
  ];
  
  // 학년 옵션
  const gradeOptions = GRADES.map((g) => ({ value: g.value, label: g.label }));
  
  // 단원 옵션 (이미 { value, label } 형태)
  const unitOptions = UNIT_OPTIONS;

  return (
    <>
      {/* 설정 폼 (showForm이 true일 때만 표시) */}
      {showForm && (
          <StudentProfileFormShell title="학생 프로필">
            <div className="space-y-5 max-[380px]:space-y-4">
              {/* ✅ 2열 그리드 = 모바일에서도 3줄(=3x3 느낌) */}
              <div className="grid grid-cols-2 gap-3 max-[380px]:gap-2">
                {/* 1) 지역 */}
                <div className="min-w-0">
                  <label className="mb-1.5 block text-sm max-[380px]:text-xs font-medium text-gray-600">
                    지역
                  </label>
                  <PurpleSelect
                    value={regionGroup}
                    onChange={(v) => {
                      setRegionGroup(v);
                      setSubRegion("");
                      setSelectedSchool(null);
                      setSchoolQuery("");
                      setSchoolOptions([]);
                    }}
                    placeholder="지역"
                    options={regionOptions}
                    selected={!!regionGroup}
                  />
                </div>

                {/* 2) 세부지역 */}
                <div className="min-w-0">
                  <label className="mb-1.5 block text-sm max-[380px]:text-xs font-medium text-gray-600">
                    {regionGroup === "서울"
                      ? "구"
                      : regionGroup === "경기"
                        ? "시/군"
                        : "세부지역"}
                  </label>
                  <PurpleSelect
                    value={subRegion}
                    onChange={(v) => {
                      setSubRegion(v);
                      setSelectedSchool(null);
                      setSchoolQuery("");
                      setSchoolOptions([]);
                    }}
                    placeholder={regionGroup === "서울" ? "구" : regionGroup === "경기" ? "시/군" : "세부지역"}
                    options={subRegionOptions}
                    disabled={subRegionOptions.length === 0}
                    selected={!!subRegion}
                  />
                </div>

                {/* 3) 학교(읽기 전용 표시) */}
                <div className="min-w-0">
                  <label className="mb-1.5 block text-sm max-[380px]:text-xs font-medium text-gray-600">
                    학교
                  </label>
                  <div className={fieldClass(!!selectedSchool) + " flex items-center"}>
                    <span className="text-sm max-[380px]:text-xs text-[#2F2A57] font-semibold truncate">
                      {selectedSchool?.name ?? "학교"}
                    </span>
                  </div>
                  {/* Hidden inputs for form submission */}
                  <input type="hidden" name="school_code" value={selectedSchool?.code ?? ""} />
                  <input type="hidden" name="school_name" value={selectedSchool?.name ?? ""} />
                </div>

                {/* 5) 학년 */}
                <div className="min-w-0">
                  <label className="mb-1.5 block text-sm max-[380px]:text-xs font-medium text-gray-600">
                    학년
                  </label>
                  <PurpleSelect
                    value={grade}
                    onChange={setGrade}
                    placeholder="학년"
                    options={gradeOptions}
                    selected={!!grade}
                  />
                </div>

                {/* 6) 과목 */}
                <div className="min-w-0">
                  <label className="mb-1.5 block text-sm max-[380px]:text-xs font-medium text-gray-600">
                    과목
                  </label>
                  <input
                    className={`${fieldClass(!!subject)} text-gray-900 placeholder:text-gray-400`}
                    value={subject}
                    readOnly
                  />
                </div>

                {/* 7) 시험 범위 */}
                <div className="min-w-0">
                  <label className="mb-1.5 block text-sm max-[380px]:text-xs font-medium text-gray-600">
                    시험 범위
                  </label>
                  <PurpleSelect
                    value={examType}
                    onChange={(v) => {
                      setExamType(v);
                    }}
                    placeholder="선택 또는 아래 단원 직접 선택"
                    options={[
                      { value: "mid1", label: "1학기 중간고사" },
                      { value: "final1", label: "1학기 기말고사" },
                      { value: "mid2", label: "2학기 중간고사" },
                      { value: "final2", label: "2학기 기말고사" },
                      { value: "overall", label: "종합평가" },
                    ]}
                    selected={!!examType}
                  />
                </div>
              </div>

              {/* 단원 복수선택 (그리드 밖, 전체 너비) */}
              <div className="mt-4">
                <label className="mb-1.5 block text-sm max-[380px]:text-xs font-medium text-gray-600">
                  단원 (복수 선택 가능)
                </label>
                <UnitMultiSelect
                  selectedUnits={selectedUnits}
                  onChange={(units) => {
                    setSelectedUnits(units);
                    // 수동 선택 시 exam 타입을 빈 문자열로 (custom)
                    setExamType("");
                  }}
                  options={[
                    { value: "u1", label: "1단원" },
                    { value: "u2", label: "2단원" },
                    { value: "u3", label: "3단원" },
                    { value: "u4", label: "4단원" },
                    { value: "u5", label: "5단원" },
                    { value: "u6", label: "6단원" },
                    { value: "u7", label: "7단원" },
                    { value: "u8", label: "8단원" },
                    { value: "u9", label: "9단원" },
                    { value: "u10", label: "10단원" },
                    { value: "u11", label: "11단원" },
                    { value: "u12", label: "12단원" },
                  ]}
                  placeholder="단원 선택"
                />
              </div>

              {/* 학교 검색 */}
              <div className="mt-4">
                <SchoolSearch
                  region={regionGroup}
                  gu={subRegion === "전체" ? "" : subRegion}
                  onSelect={(s) => {
                    // ✅ 기존 "학교 선택" 드롭다운에 반영되게 연결
                    setSelectedSchool({
                      code: s.schoolCode,
                      name: s.name,
                      location: regionGroup, // regionGroup을 location으로 사용
                      kind: "", // SchoolSearch에서 kind를 전달하지 않으므로 빈 문자열
                      address: "", // SchoolSearch에서 address를 전달하지 않으므로 빈 문자열
                    });
                    // 디버그
                    console.log("[SchoolSearch] selected:", s);
                  }}
                />
              </div>

              {error && (
                <div className="mt-4 rounded-lg bg-red-50 p-3 max-[380px]:p-2.5 text-sm max-[380px]:text-xs text-red-600">
                  {error}
                </div>
              )}

              {/* 저장/취소 버튼 */}
              <div className="mt-5 flex flex-col gap-3 max-[380px]:gap-2">
                <button
                  type="button"
                  onClick={handleSaveProfile}
                  disabled={saving || !selectedSchool || !authReady || !user}
                  className={`h-14 w-full rounded-xl ${PRIMARY_BG} text-lg max-[380px]:h-12 max-[380px]:text-base text-white font-semibold shadow-sm hover:shadow-md active:scale-[0.98] transition-all disabled:cursor-not-allowed disabled:bg-gray-300 disabled:hover:bg-gray-300 disabled:opacity-50 disabled:active:scale-100`}
                >
                  {saving ? "저장 중..." : !authReady ? "" : !user ? "로그인이 필요합니다" : "프로필 저장"}
                </button>

                {/* 취소 버튼 (프로필이 있을 때만) */}
                {profile && isProfileComplete(profile) && (
                  <button
                    type="button"
                    onClick={() => {
                      setShowForm(false);
                      setEditMode(false);
                      router.replace(`/${locale}/student`);
                    }}
                    className="h-14 w-full rounded-xl border-2 border-blue-300 bg-white text-lg max-[380px]:h-12 max-[380px]:text-base text-[#2563eb] font-semibold hover:bg-blue-50 hover:border-blue-400 active:scale-[0.98] transition-all"
                  >
                    취소
                  </button>
                )}
              </div>
          </div>
        </StudentProfileFormShell>
      )}

      {/* StudentHomeShell UI (프로필이 완성되었을 때만 표시) */}
      {!showForm && profile && isProfileComplete(profile) && (
        <StudentHomeShell>
          <div className="px-1 pt-3 pb-24">
            <div className="px-5 mb-6">
              <ScreenTitle>훈련 PICK</ScreenTitle>
            </div>

            <ScreenCard>
              {/* 프로필 카드 */}
              <div className="min-w-0">
                {/* 학교명 */}
                <div className="text-[18px] max-[380px]:text-base font-extrabold tracking-tight text-[#2563eb]">
                  {profile?.school ?? "학교 미설정"}
                </div>
                <div className="mt-1 text-sm max-[380px]:text-xs text-slate-600">
                  {formatProfileInfo()}
                </div>
              </div>

              {/* 주요 액션 버튼들 - 애플 글래스모피즘 스타일 */}
              <div className="mt-8 space-y-3.5 max-[380px]:mt-3 max-[380px]:space-y-3">
                {/* 1. 단어/숙어 훈련 - 라이트 블루 */}
                <button
                  type="button"
                  onClick={() => router.push("/play")}
                  className="group relative overflow-hidden w-full h-14 max-[380px]:h-12 rounded-[20px] text-lg max-[380px]:text-base font-semibold transition-all duration-500 ease-out select-none active:scale-[0.97]"
                  style={{
                    background: "linear-gradient(145deg, #dbeafe 0%, #bfdbfe 50%, #93c5fd 100%)",
                    boxShadow: "0 6px 20px -4px rgba(59,130,246,0.25), 0 0 0 1px rgba(255,255,255,0.6) inset",
                    color: "#1e40af",
                  }}
                >
                  {/* 호버 시 밝아지는 오버레이 */}
                  <div className="absolute inset-0 bg-gradient-to-br from-white/0 to-blue-200/0 group-hover:from-white/40 group-hover:to-blue-200/20 transition-all duration-500 pointer-events-none" />

                  {/* 상단 글로우 */}
                  <div
                    className="absolute top-0 left-0 right-0 h-[50%] opacity-60 group-hover:opacity-80 transition-opacity duration-500 pointer-events-none rounded-t-[20px]"
                    style={{ background: "linear-gradient(to bottom, rgba(255,255,255,0.7), transparent)" }}
                  />

                  {/* 호버 시 외곽 글로우 */}
                  <div
                    className="absolute -inset-[1px] rounded-[20px] opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                    style={{
                      background: "linear-gradient(145deg, rgba(147,197,253,0.5), rgba(191,219,254,0.3))",
                      filter: "blur(2px)",
                    }}
                  />

                  <span className="relative z-10">단어/숙어 훈련</span>
                </button>

                {/* 2. 본문 선택형 훈련 - 미디엄 블루 */}
                <button
                  type="button"
                  onClick={handleStartReadingAB}
                  className="group relative overflow-hidden w-full h-14 max-[380px]:h-12 rounded-[20px] text-lg max-[380px]:text-base font-semibold transition-all duration-500 ease-out select-none active:scale-[0.97]"
                  style={{
                    background: "linear-gradient(145deg, #93c5fd 0%, #60a5fa 50%, #3b82f6 100%)",
                    boxShadow: "0 8px 24px -4px rgba(59,130,246,0.35), 0 0 0 1px rgba(255,255,255,0.3) inset",
                    color: "#1e3a8a",
                  }}
                >
                  {/* 호버 시 밝아지는 오버레이 */}
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-300/0 to-blue-500/0 group-hover:from-blue-300/25 group-hover:to-blue-500/15 transition-all duration-500 pointer-events-none" />

                  {/* 상단 글로우 */}
                  <div
                    className="absolute top-0 left-0 right-0 h-[50%] opacity-50 group-hover:opacity-70 transition-opacity duration-500 pointer-events-none rounded-t-[20px]"
                    style={{ background: "linear-gradient(to bottom, rgba(255,255,255,0.4), transparent)" }}
                  />

                  {/* 호버 시 외곽 글로우 */}
                  <div
                    className="absolute -inset-[1px] rounded-[20px] opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                    style={{
                      background: "linear-gradient(145deg, rgba(96,165,250,0.6), rgba(59,130,246,0.4))",
                      filter: "blur(2px)",
                    }}
                  />

                  <span className="relative z-10">본문 선택형 훈련</span>
                </button>

                {/* 3. 서술형 대비 훈련 - 딥 블루 */}
                <button
                  type="button"
                  onClick={() => {
                    const params = new URLSearchParams({
                      grade: grade,
                      subject: subject,
                      region: regionGroup,
                      sub: subRegion,
                      school: selectedSchool?.code ?? "",
                      unit: unitRange,
                    });
                    router.push(`/${locale}/student/vocab-game?${params.toString()}`);
                  }}
                  className="group relative overflow-hidden w-full h-14 max-[380px]:h-12 rounded-[20px] text-lg max-[380px]:text-base font-semibold transition-all duration-500 ease-out select-none active:scale-[0.97]"
                  style={{
                    background: "linear-gradient(145deg, #3b82f6 0%, #2563eb 50%, #1d4ed8 100%)",
                    boxShadow: "0 8px 28px -4px rgba(37,99,235,0.4), 0 0 0 1px rgba(255,255,255,0.2) inset",
                    color: "white",
                  }}
                >
                  {/* 호버 시 밝아지는 오버레이 */}
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-400/0 to-blue-600/0 group-hover:from-blue-400/20 group-hover:to-blue-600/10 transition-all duration-500 pointer-events-none" />

                  {/* 상단 글로우 */}
                  <div
                    className="absolute top-0 left-0 right-0 h-[45%] opacity-40 group-hover:opacity-60 transition-opacity duration-500 pointer-events-none rounded-t-[20px]"
                    style={{ background: "linear-gradient(to bottom, rgba(255,255,255,0.3), transparent)" }}
                  />

                  {/* 호버 시 외곽 글로우 */}
                  <div
                    className="absolute -inset-[1px] rounded-[20px] opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                    style={{
                      background: "linear-gradient(145deg, rgba(96,165,250,0.6), rgba(59,130,246,0.4))",
                      filter: "blur(3px)",
                    }}
                  />

                  {/* 미세한 반짝임 */}
                  <div
                    className="absolute inset-0 opacity-[0.1] pointer-events-none"
                    style={{
                      background: `
                        radial-gradient(circle at 20% 30%, rgba(255,255,255,0.6) 0, transparent 2px),
                        radial-gradient(circle at 80% 25%, rgba(255,255,255,0.5) 0, transparent 1.5px)
                      `,
                    }}
                  />

                  <span className="relative z-10 drop-shadow-[0_2px_4px_rgba(0,0,0,0.2)]">서술형 대비 훈련</span>
                </button>

                {/* 4. 문장 배열 훈련 - 다크 블루 (가장 진함) */}
                <button
                  onClick={() => router.push(`/${locale}/student/reading-ab2`)}
                  className="group relative overflow-hidden w-full h-14 max-[380px]:h-12 rounded-[20px] text-lg max-[380px]:text-base font-semibold transition-all duration-500 ease-out select-none active:scale-[0.97]"
                  style={{
                    background: "linear-gradient(145deg, #1e40af 0%, #1e3a8a 50%, #172554 100%)",
                    boxShadow: "0 10px 32px -4px rgba(30,64,175,0.5), 0 0 0 1px rgba(255,255,255,0.1) inset",
                    color: "white",
                  }}
                >
                  {/* 호버 시 밝아지는 오버레이 */}
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-400/0 to-blue-600/0 group-hover:from-blue-400/20 group-hover:to-blue-600/10 transition-all duration-500 pointer-events-none" />

                  {/* 상단 글로우 */}
                  <div
                    className="absolute top-0 left-0 right-0 h-[45%] opacity-40 group-hover:opacity-60 transition-opacity duration-500 pointer-events-none rounded-t-[20px]"
                    style={{ background: "linear-gradient(to bottom, rgba(255,255,255,0.25), transparent)" }}
                  />

                  {/* 호버 시 외곽 글로우 */}
                  <div
                    className="absolute -inset-[1px] rounded-[20px] opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                    style={{
                      background: "linear-gradient(145deg, rgba(96,165,250,0.6), rgba(59,130,246,0.4))",
                      filter: "blur(3px)",
                    }}
                  />

                  {/* 미세한 반짝임 */}
                  <div
                    className="absolute inset-0 opacity-[0.12] pointer-events-none"
                    style={{
                      background: `
                        radial-gradient(circle at 15% 30%, rgba(255,255,255,0.6) 0, transparent 2px),
                        radial-gradient(circle at 85% 25%, rgba(255,255,255,0.5) 0, transparent 1.5px),
                        radial-gradient(circle at 70% 70%, rgba(255,255,255,0.55) 0, transparent 2px)
                      `,
                    }}
                  />

                  <span className="relative z-10 drop-shadow-[0_2px_8px_rgba(0,0,0,0.3)]">문장 배열 훈련</span>
                </button>

                {/* ✅ 버튼 아래 공간 (답답함 해결) */}
                <div className="h-3" />
              </div>
            </ScreenCard>
          </div>
        </StudentHomeShell>
      )}
    </>
  );
}

