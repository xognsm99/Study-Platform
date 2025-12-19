"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter, useParams } from "next/navigation";
import { ENGLISH_CATEGORIES, normalizeCategory, getCategoryLabel } from "@/lib/utils/constants";
import { createSupabaseBrowser } from "@/lib/supabase/browser";
import SchoolSearch from "@/components/SchoolSearch";

type School = { id: string; name: string };
type TextbookMap = {
  map: {
    schoolId: string;
    schoolName: string;
    grade: string;
    subject: string;
    publisher: string;
    year: number | null;
  };
  blueprint: {
    styleJson: any;
  } | null;
};

// 학년 옵션 상수 (value는 DB/URL용 코드값: "1", "2", "3")
const MIDDLE_GRADES = [
  { value: "1", label: "중1" },
  { value: "2", label: "중2" },
  { value: "3", label: "중3" },
] as const;

const HIGH_GRADES = [
  { value: "1", label: "고1" },
  { value: "2", label: "고2" },
  { value: "3", label: "고3" },
] as const;

// 과목 옵션 상수 (value는 표준 코드: "english" 등)
const SUBJECTS = [
  { value: "english", label: "영어", enabled: true },
  { value: "korean", label: "국어(준비중)", enabled: false },
  { value: "math", label: "수학(준비중)", enabled: false },
  { value: "science", label: "과학(준비중)", enabled: false },
] as const;

type SubjectOption = typeof SUBJECTS[number];

// 학년 표시 텍스트 변환 함수 (코드값 → 사람 읽기용)
const formatGradeLabel = (grade: string): string => {
  // "중1" / "고2" 형태
  if (grade.startsWith("중") || grade.startsWith("고")) {
    return grade.replace(/^[중고]/, "") + "학년";
  }
  // "1" / "2" / "3" 코드값
  if (/^[1-3]$/.test(grade)) {
    return grade + "학년";
  }
  return grade;
};

// 도시 정보 (하드코딩 - seed 데이터 기반)
const CITIES = [
  { id: "city-gimhae", name: "김해시" },
  { id: "city-changwon", name: "창원시" },
] as const;

// 도시별 권역 설정
type RegionKey = "all" | "jangyu" | "jinyeong" | "changwon" | "masan" | "jinhae";

const REGION_CONFIG: Record<string, { label: string; key: RegionKey }[]> = {
  김해시: [
    { label: "전체", key: "all" },
    { label: "장유권", key: "jangyu" },
    { label: "진영권", key: "jinyeong" },
  ],
  창원시: [
    { label: "전체", key: "all" },
    { label: "창원권", key: "changwon" },
    { label: "마산권", key: "masan" },
    { label: "진해권", key: "jinhae" },
  ],
};

// 김해시 권역별 학교 목록
const GIMHAE_JANGYU_SCHOOLS = [
  "관동중학교",
  "김해모산중학교",
  "내덕중학교",
  "능동중학교",
  "대청중학교",
  "수남중학교",
  "월산중학교",
  "율하중학교",
  "장유중학교",
];

const GIMHAE_JINYEONG_SCHOOLS = [
  "진영중학교",
  "진영장등중학교",
  "한얼중학교",
];

// 창원시 권역별 학교 allowlist (이름에 지역명이 없는 학교들 포함)
const CHANGWON_JINHAE_SCHOOLS = [
  "진해중학교",
  "진해여자중학교",
  "진해남중학교",
  "안골포중학교", // 진해구 안골포동
  "웅동중학교",   // 진해구 웅동
  "웅남중학교",   // 진해구 웅남
  "용원중학교",   // 진해구 용원동
] as const;

const CHANGWON_MASAN_SCHOOLS: string[] = [];

// 문자열 정규화 함수 (공백 제거, 괄호 내용 제거)
const normalize = (s: string) =>
  s.replace(/\s/g, "").replace(/\(.*?\)/g, "");

type Step = 0 | 1 | 2 | 3 | 4 | 5; // 0: 역할 선택
type ProfileRole = "student" | "parent" | "teacher";

export default function SetupPage() {
  const router = useRouter();
  const params = useParams();
  const locale = (params?.locale as string) || "ko";

  const [currentStep, setCurrentStep] = useState<Step>(0);
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(false);

  // ✅ 역할 선택 상태
  const [selectedRole, setSelectedRole] = useState<"student" | "parent" | "teacher" | "">("");

  // Selection states
  const [selectedCityId, setSelectedCityId] = useState<string>("");
  const [selectedCityName, setSelectedCityName] = useState<string>("");
  // ✅ 원본 학교 목록만 state로 유지
  const [baseSchools, setBaseSchools] = useState<School[]>([]);
  const [selectedSchool, setSelectedSchool] = useState<string>("");
  const [selectedSchoolName, setSelectedSchoolName] = useState<string>("");
  const [selectedGrade, setSelectedGrade] = useState<string>("");
  const [selectedSubject, setSelectedSubject] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]); // 여러 카테고리 선택
  // ✅ 프로필 정보 (역할별 공통)
  const [profileName, setProfileName] = useState<string>("");
  // ✅ 교사용 과목 (teacher role일 때만 사용)
  const [teacherSubject, setTeacherSubject] = useState<string>("");

  const [textbookMap, setTextbookMap] = useState<TextbookMap | null>(null);

  // 권역 필터 상태 (도시별)
  const [areaFilter, setAreaFilter] = useState<RegionKey>("all");
  const isGimhae = selectedCityName === "김해시";
  const isChangwon = selectedCityName === "창원시";
  
  // SchoolSearch용 region/gu 상태 (예: "서울", "강남구")
  const [region, setRegion] = useState<string>("");
  const [gu, setGu] = useState<string>("");
  
  // 선택된 학교 정보 (SchoolSearch에서 사용)
  const [selectedSchoolItem, setSelectedSchoolItem] = useState<any>(null);
  
  // 드래그 상태 관리
  const [draggingCityId, setDraggingCityId] = useState<string | null>(null);

  // Supabase 클라이언트
  const supabase = createSupabaseBrowser();

  // 학교 타입 판별 (중학교/고등학교)
  const isMiddleSchool = selectedSchoolName.includes("중학교");
  const isHighSchool = selectedSchoolName.includes("고등학교") || selectedSchoolName.includes("고등");
  
  // 현재 학교 타입에 맞는 학년 옵션
  const availableGrades: readonly { value: string; label: string }[] = isMiddleSchool 
    ? MIDDLE_GRADES 
    : isHighSchool 
    ? HIGH_GRADES 
    : MIDDLE_GRADES;

  // 도시별 학교 필터링 함수
  const filterSchoolsByRegion = (schools: School[], cityName: string, filter: RegionKey): School[] => {
    if (filter === "all") {
      return schools;
    }

    // 김해시 필터링
    if (cityName === "김해시") {
      if (filter === "jangyu") {
        return schools.filter((s) =>
          GIMHAE_JANGYU_SCHOOLS.some((name) => normalize(s.name) === normalize(name))
        );
      }
      if (filter === "jinyeong") {
        return schools.filter((s) =>
          GIMHAE_JINYEONG_SCHOOLS.some((name) => normalize(s.name) === normalize(name))
        );
      }
    }

    // 창원시 필터링 (규칙 기반 + allowlist)
    if (cityName === "창원시") {
      if (filter === "jinhae") {
        // 우선순위 1: allowlist 체크
        // 우선순위 2: 이름에 "진해" 포함 체크
        return schools.filter((s) => {
          const normalizedName = normalize(s.name);
          return (
            CHANGWON_JINHAE_SCHOOLS.some((name) => normalizedName === normalize(name)) ||
            normalizedName.includes("진해")
          );
        });
      }
      if (filter === "masan") {
        // 우선순위 1: allowlist 체크
        // 우선순위 2: 이름에 "마산" 포함 체크
        return schools.filter((s) => {
          const normalizedName = normalize(s.name);
          return (
            CHANGWON_MASAN_SCHOOLS.some((name) => normalizedName === normalize(name)) ||
            normalizedName.includes("마산")
          );
        });
      }
      if (filter === "changwon") {
        // 진해, 마산 제외한 나머지 = 창원권
        const normalizedName = (s: School) => normalize(s.name);
        return schools.filter((s) => {
          const name = normalizedName(s);
          const isJinhae =
            CHANGWON_JINHAE_SCHOOLS.some((listName) => name === normalize(listName)) ||
            name.includes("진해");
          const isMasan =
            CHANGWON_MASAN_SCHOOLS.some((listName) => name === normalize(listName)) ||
            name.includes("마산");
          return !isJinhae && !isMasan;
        });
      }
    }

    return schools;
  };

  // ✅ 화면에 표시할 학교 목록 (useMemo로 계산)
  const displayedSchools = useMemo(() => {
    if (currentStep < 2 || !selectedCityName) {
      return [];
    }
    return filterSchoolsByRegion(baseSchools, selectedCityName, areaFilter);
  }, [currentStep, baseSchools, selectedCityName, areaFilter]);

  // Step 1: 도시 선택
  const handleCitySelect = (cityId: string, cityName: string) => {
    setSelectedCityId(cityId);
    setSelectedCityName(cityName);
    setSelectedSchool("");
    setSelectedSchoolName("");
    setAreaFilter("all");
    setCurrentStep(2);
  };

  // Step 2: 학교 로드
  useEffect(() => {
    if (!selectedCityId || currentStep < 2) {
      setBaseSchools([]);
      return;
    }

    fetch(`/api/schools?cityId=${selectedCityId}`)
      .then((res) => res.json())
      .then((data) => {
        const loadedSchools = data.schools || [];
        setBaseSchools(loadedSchools);
      })
      .catch(console.error);
  }, [selectedCityId, currentStep]);

  // ✅ 필터 변경 시 선택된 학교가 필터에 없으면 리셋
  useEffect(() => {
    if (currentStep >= 2 && selectedSchool && displayedSchools.length > 0) {
      if (!displayedSchools.find((s: School) => s.id === selectedSchool)) {
        setSelectedSchool("");
        setSelectedSchoolName("");
      }
    }
    
    // 개발 모드에서 디버그 정보 출력
    if (process.env.NODE_ENV === "development" && currentStep >= 2) {
      console.log(`[Filter Debug] 도시: ${selectedCityName}, 권역: ${areaFilter}`);
      console.log(`[Filter Debug] 전체 학교 수: ${baseSchools.length}`);
      console.log(`[Filter Debug] 필터링된 학교 수: ${displayedSchools.length}`);
      if (selectedCityName === "창원시" && areaFilter === "jinhae") {
        console.log(`[Filter Debug] 진해권 학교 목록:`, displayedSchools.map((s: School) => s.name));
      }
    }
  }, [currentStep, selectedSchool, displayedSchools, baseSchools.length, selectedCityName, areaFilter]);

  // Step 2: 학교 선택
  const handleSchoolSelect = (schoolId: string, schoolName: string) => {
    setSelectedSchool(schoolId);
    setSelectedSchoolName(schoolName);
    // 학교 변경 시 학년/과목 리셋 (학교 타입이 달라질 수 있음)
    setSelectedGrade("");
    setSelectedSubject("");
    setSelectedCategory("");
    setCurrentStep(3);
  };

  // Step 3: 교과서 맵 로드 (학년/과목 선택 시)
  useEffect(() => {
    if (!selectedSchool || !selectedGrade || !selectedSubject || currentStep < 3) {
      setTextbookMap(null);
      return;
    }

    fetch(
      `/api/textbook-map?schoolId=${selectedSchool}&grade=${selectedGrade}&subject=${selectedSubject}`
    )
      .then((res) => res.json())
      .then((data) => {
        // API가 map을 반환하면 사용, 없으면 기본값으로 처리
        if (data.map) {
          // publisher가 없으면 기본값으로 설정
          if (!data.map.publisher) {
            data.map.publisher = "동아출판사";
          }
          // blueprint가 없어도 map만 있으면 진행 가능
          setTextbookMap(data);
        } else {
          setTextbookMap(null);
        }
      })
      .catch(console.error);
  }, [selectedSchool, selectedGrade, selectedSubject, currentStep]);

  // ✅ 역할별 프로필 저장 핸들러
  // TODO: 나중에 프로필 기반 기능(결제/프리셋 저장/기관 관리) 확장 시 name 필드 추가 가능
  const handleSaveProfile = async () => {
    if (!selectedRole) {
      return;
    }

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        // 로그인 없이도 진행 가능하도록 처리
        // TODO: 나중에 인증이 필요한 기능 추가 시 여기서 체크
      }

      // name 필드는 제거, role과 선택적 정보만 저장
      const profileData: any = {
        id: user?.id,
        role: selectedRole,
        updated_at: new Date().toISOString(),
      };

      if (selectedRole === "student") {
        // student: 학교(선택), 학년(선택)
        if (selectedSchool && selectedGrade && selectedSchoolName) {
          const gradeNumber = selectedGrade.startsWith("중")
            ? parseInt(selectedGrade.replace("중", ""))
            : selectedGrade.startsWith("고")
            ? parseInt(selectedGrade.replace("고", ""))
            : null;

          if (gradeNumber !== null) {
            profileData.school = selectedSchoolName;
            profileData.grade = gradeNumber;
          }
        }
        // 학생은 setup 페이지에서 계속 진행 (학년/과목 선택)
        // 저장 없이 바로 진행 가능
      } else if (selectedRole === "teacher") {
        // teacher: 학교(선택), 과목(선택)
        if (selectedSchool && selectedSchoolName) {
          profileData.school = selectedSchoolName;
        }
        if (teacherSubject) {
          profileData.subject = teacherSubject;
        }
        
        // 교사는 /teacher로 이동
        router.push("/teacher");
        return;
      } else if (selectedRole === "parent") {
        // parent: 정보 없이도 진행 가능
        // 학부모 페이지가 없으면 임시 안내 페이지로
        router.push(`/${locale}/parent`);
        return;
      }

      // 로그인한 경우에만 프로필 저장
      if (user) {
        const { error } = await supabase.from("profiles").upsert(profileData, {
          onConflict: "id",
        });

        if (error) {
          console.error("Failed to save profile", error);
          // 저장 실패해도 진행 가능하도록 에러 무시
        }
      }
    } catch (error: any) {
      console.error("Failed to save profile", error);
      // 저장 실패해도 진행 가능하도록 에러 무시
    }
  };

  // 문제 생성
  const handleGenerate = async () => {
    if (
      !selectedCityId ||
      !selectedSchool ||
      !selectedGrade ||
      !selectedSubject ||
      !selectedCategory ||
      !textbookMap
    ) {
      return;
    }

    if (cooldown) {
      return;
    }

    setLoading(true);
    setCooldown(true);

    try {
      const school = displayedSchools.find((s) => s.id === selectedSchool) || 
                     baseSchools.find((s) => s.id === selectedSchool);

      // ✅ categories 배열 준비 - 체크된 것만 전달
      let categoriesToSend: string[] = [];
      
      if (selectedCategories.length > 0) {
        // 체크박스로 선택한 카테고리 사용
        // 카테고리 매핑: 어휘->vocab, 문법->grammar, 본문->reading, 대화문->dialogue
        const categoryMap: Record<string, string> = {
          "vocab": "vocab",
          "어휘": "vocab",
          "grammar": "grammar",
          "문법": "grammar",
          "body": "reading",
          "본문": "reading",
          "reading": "reading",
          "dialogue": "dialogue",
          "대화문": "dialogue",
        };
        
        categoriesToSend = selectedCategories
          .map(cat => categoryMap[cat] || cat)
          .filter(cat => ["vocab", "grammar", "reading", "dialogue"].includes(cat));
      } else if (selectedCategory) {
        // 단일 카테고리 선택 시 배열로 변환
        const normalized = normalizeCategory(selectedCategory);
        const categoryMap: Record<string, string> = {
          "vocab": "vocab",
          "어휘": "vocab",
          "grammar": "grammar",
          "문법": "grammar",
          "body": "reading",
          "본문": "reading",
          "reading": "reading",
          "dialogue": "dialogue",
          "대화문": "dialogue",
        };
        const mapped = categoryMap[normalized] || normalized;
        if (["vocab", "grammar", "reading", "dialogue"].includes(mapped)) {
          categoriesToSend = [mapped];
        }
      }
      
      // ✅ categories가 빈 배열이면 요청 막기
      if (categoriesToSend.length === 0) {
        alert("유형을 선택해 주세요.");
        setLoading(false);
        setCooldown(false);
        return;
      }

      // ✅ 학생 모드: /api/generate-problem 호출 제거, 바로 퀴즈 페이지로 이동
      // 문제 생성은 퀴즈 페이지에서 /api/student/random으로 처리
      
      // 시험 메타 정보를 localStorage에 저장
      const now = new Date();
      const examMeta = {
        schoolName: school?.name || "",
        // grade/subject는 항상 코드값("2", "english")을 저장
        grade: selectedGrade,
        subject: selectedSubject,
        category: selectedCategory,
        year: now.getFullYear(),
        semester: now.getMonth() < 6 ? 1 : 2,
        termLabel: selectedCategory === "final" ? "기말고사" : "중간고사" as const,
      };
      
      try {
        localStorage.setItem("examMeta", JSON.stringify(examMeta));
      } catch (e) {
        console.error("Failed to save examMeta to localStorage", e);
      }
      
      // 퀴즈 페이지로 이동
      // subject/grade는 이미 코드값(value) 이므로 그대로 사용
      const subjectKey = selectedSubject;
      const gradeKey = String(selectedGrade || "");
      
      // ✅ 여러 카테고리가 선택되었으면 mix 페이지로, 아니면 단일 카테고리 페이지로
      if (selectedCategories.length > 0) {
        // ✅ URL에는 DB 실제 category 코드(vocab/grammar/reading/dialogue)만 포함
        const categoriesParam = categoriesToSend.join(",");
        router.push(
          `/${locale}/student/${encodeURIComponent(gradeKey)}/${subjectKey}/mix?categories=${categoriesParam}`
        );
      } else {
        router.push(
          `/${locale}/student/${encodeURIComponent(gradeKey)}/${subjectKey}/${categoriesToSend[0] ?? selectedCategory}`
        );
      }
      
      setLoading(false);
      setCooldown(false);
    } catch (error) {
      console.error("Failed to generate problems", error);
      setLoading(false);
      setCooldown(false);
    }
  };

  // 선택한 과목이 활성화된 과목인지 확인
  const selectedSubjectEnabled = selectedSubject
    ? (SUBJECTS as readonly SubjectOption[]).find((s) => s.value === selectedSubject)?.enabled ?? false
    : false;

  const canGenerate =
    selectedCityId &&
    selectedSchool &&
    selectedGrade &&
    selectedSubject &&
    selectedSubjectEnabled && // 준비중 과목은 진행 불가
    (selectedCategory || selectedCategories.length > 0) &&
    textbookMap &&
    !loading &&
    !cooldown;


  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-8">
      <div className="mx-auto max-w-3xl">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-900">학생 설정</h1>
        </div>

        <div className="rounded-[24px] border-2 border-slate-200 bg-white p-6 shadow-md">
          {/* Step 0: 역할 선택 */}
          {currentStep === 0 && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold text-slate-900">역할을 선택하세요</h2>
              <div className="grid gap-4 sm:grid-cols-3">
                <button
                  onClick={() => {
                    setSelectedRole("student");
                    setCurrentStep(1);
                  }}
                  className="rounded-xl border-2 border-slate-200 bg-white p-6 text-center transition-all hover:border-slate-900 hover:bg-slate-50"
                >
                  <div className="text-2xl mb-2">🎓</div>
                  <div className="font-semibold text-slate-900">학생</div>
                  <div className="mt-1 text-xs text-slate-500">학교/학년 선택</div>
                </button>

                <button
                  onClick={() => {
                    setSelectedRole("parent");
                    // 학부모는 준비중이므로 임시 안내 페이지로 이동
                    router.push(`/${locale}/parent`);
                  }}
                  className="rounded-xl border-2 border-slate-200 bg-white p-6 text-center transition-all hover:border-slate-900 hover:bg-slate-50"
                >
                  <div className="text-2xl mb-2">👨‍👩‍👧</div>
                  <div className="font-semibold text-slate-900">학부모</div>
                  <div className="mt-1 text-xs text-slate-500">준비중</div>
                </button>

                <button
                  onClick={() => {
                    // 교사는 바로 /teacher로 이동
                    router.push("/teacher");
                  }}
                  className="rounded-xl border-2 border-slate-200 bg-white p-6 text-center transition-all hover:border-slate-900 hover:bg-slate-50"
                >
                  <div className="text-2xl mb-2">👨‍🏫</div>
                  <div className="font-semibold text-slate-900">교사</div>
                  <div className="mt-1 text-xs text-slate-500">학교/과목 선택</div>
                </button>
              </div>
            </div>
          )}

          {/* Step 1: 역할별 입력 폼 */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-slate-900">
                  {selectedRole === "student"
                    ? "학생 정보 입력"
                    : selectedRole === "parent"
                    ? "학부모 정보 입력"
                    : "교사 정보 입력"}
                </h2>
                <button
                  onClick={() => {
                    setCurrentStep(0);
                    setSelectedRole("");
                    setSelectedSchool("");
                    setSelectedSchoolName("");
                    setSelectedGrade("");
                    setTeacherSubject("");
                  }}
                  className="text-sm font-medium text-slate-600 hover:text-slate-900"
                >
                  ← 역할 다시 선택
                </button>
              </div>

              {/* 학생: 학교/학년 입력 */}
              {selectedRole === "student" && (
                <>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      학교 선택
                    </label>
                    <button
                      onClick={() => setCurrentStep(2)}
                      className="h-11 w-full rounded-lg border border-slate-300 bg-white px-4 text-left text-base text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                    >
                      {selectedSchoolName || "도시를 선택하세요"}
                    </button>
                  </div>

                  {selectedSchoolName && selectedGrade && (
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">
                        학년
                      </label>
                      <select
                        value={selectedGrade}
                        onChange={(e) => setSelectedGrade(e.target.value)}
                        className="h-11 w-full rounded-lg border border-slate-300 bg-white px-4 text-base text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                      >
                        <option value="">선택하세요</option>
                        {availableGrades.map((g: { value: string; label: string }) => (
                          <option key={g.value} value={g.value}>
                            {g.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                </>
              )}

              {/* 학부모: 이름만 */}
              {selectedRole === "parent" && (
                <>
                </>
              )}

              {/* 교사: 학교/과목 입력 */}
              {selectedRole === "teacher" && (
                <>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      학교 선택
                    </label>
                    <button
                      onClick={() => setCurrentStep(2)}
                      className="h-11 w-full rounded-lg border border-slate-300 bg-white px-4 text-left text-base text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                    >
                      {selectedSchoolName || "도시를 선택하세요"}
                    </button>
                  </div>

                  {selectedSchoolName && (
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">
                        담당 과목
                      </label>
                      <select
                        value={teacherSubject}
                        onChange={(e) => setTeacherSubject(e.target.value)}
                        className="h-11 w-full rounded-lg border border-slate-300 bg-white px-4 text-base text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                      >
                        <option value="">선택하세요</option>
                        <option value="영어">영어</option>
                        <option value="국어">국어</option>
                        <option value="수학">수학</option>
                        <option value="과학">과학</option>
                        <option value="사회">사회</option>
                      </select>
                    </div>
                  )}
                </>
              )}

              {/* 저장 버튼 */}
              <button
                onClick={handleSaveProfile}
                className="mt-4 w-full rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white
                           hover:bg-blue-700"
              >
                저장하고 계속
              </button>
            </div>
          )}

          {/* Step 2: 도시 선택 (학생/교사 공통) */}
          {currentStep === 2 && (selectedRole === "student" || selectedRole === "teacher") && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-slate-900">도시를 선택하세요</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                {CITIES.map((city) => {
                  const isSelected = selectedCityId === city.id;
                  const isDragging = draggingCityId === city.id;
                  return (
                    <button
                      key={city.id}
                      onClick={() => handleCitySelect(city.id, city.name)}
                      onPointerDown={() => setDraggingCityId(city.id)}
                      onPointerUp={() => setDraggingCityId(null)}
                      onPointerLeave={() => setDraggingCityId(null)}
                      className={`relative rounded-xl border-2 p-8 text-center transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-slate-300 ${
                        isSelected
                          ? "border-slate-900 bg-slate-900 text-white scale-105 shadow-lg"
                          : isDragging
                          ? "border-slate-500 bg-slate-100 text-slate-900 shadow-lg"
                          : "border-slate-300 bg-white text-slate-900 hover:bg-slate-50 hover:border-slate-400 hover:shadow-md active:scale-[0.99]"
                      }`}
                    >
                      <div className={`text-2xl font-bold ${isSelected ? "text-white" : "text-slate-900"}`}>
                        {city.name}
                      </div>
                      {isSelected && (
                        <div className="mt-2 text-sm font-medium text-white/90">
                          ✓ 선택됨
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Step 2: 학교 선택 */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-slate-900">
                  {selectedCityName} 학교 선택
                </h2>
                <button
                  onClick={() => {
                    setCurrentStep(1);
                    setSelectedCityId("");
                    setSelectedCityName("");
                  }}
                  className="text-sm font-medium text-slate-600 hover:text-slate-900"
                >
                  ← 도시 다시 선택
                </button>
              </div>

              {/* 학교 검색 컴포넌트 */}
              <SchoolSearch
                region={region || selectedCityName || ""}
                gu={gu === "전체" ? "" : gu}
                onSelect={(s) => {
                  setSelectedSchoolItem(s);
                  // SchoolSearch에서 선택한 학교를 기존 로직에 맞게 변환
                  // schoolCode를 id로 사용하거나, name으로 찾기
                  const matchedSchool = baseSchools.find((school) => school.name === s.name);
                  if (matchedSchool) {
                    handleSchoolSelect(matchedSchool.id, matchedSchool.name);
                  } else {
                    // 매칭되는 학교가 없으면 새로 추가하거나, schoolCode를 id로 사용
                    setSelectedSchool(s.schoolCode);
                    setSelectedSchoolName(s.name);
                    if (selectedRole === "student") {
                      setCurrentStep(1);
                    } else {
                      setCurrentStep(1);
                    }
                  }
                }}
              />

              {selectedSchoolItem && (
                <div className="mt-3 rounded-xl border p-3 text-sm">
                  <div className="font-medium">{selectedSchoolItem.name}</div>
                  <div className="text-gray-600">{selectedSchoolItem.address}</div>
                </div>
              )}

              {/* 권역 필터 (도시별) */}
              {selectedCityName && REGION_CONFIG[selectedCityName] && (
                <div className="flex gap-2 flex-wrap">
                  {REGION_CONFIG[selectedCityName].map((region) => (
                    <button
                      key={region.key}
                      type="button"
                      onClick={() => setAreaFilter(region.key)}
                      className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-slate-300 ${
                        areaFilter === region.key
                          ? "bg-slate-900 text-white"
                          : "bg-slate-100 text-slate-700 hover:bg-slate-200 active:bg-slate-300"
                      }`}
                    >
                      {region.label}
                    </button>
                  ))}
                </div>
              )}

              <div className="max-h-96 space-y-2 overflow-y-auto">
                {displayedSchools.length > 0 ? (
                  displayedSchools.map((school: School) => (
                    <button
                      key={school.id}
                      onClick={() => {
                        handleSchoolSelect(school.id, school.name);
                        // 학생은 학년 선택으로, 교사는 정보 입력으로 돌아가기
                        if (selectedRole === "student") {
                          setCurrentStep(1);
                        } else {
                          setCurrentStep(1);
                        }
                      }}
                      className={`w-full rounded-lg border-2 p-4 text-left transition-all ${
                        selectedSchool === school.id
                          ? "border-slate-900 bg-slate-50"
                          : "border-slate-200 bg-white hover:border-slate-400 hover:bg-slate-50"
                      }`}
                    >
                      <div className="font-semibold text-slate-900">{school.name}</div>
                    </button>
                  ))
                ) : (
                  <div className="rounded-lg border-2 border-slate-200 bg-slate-50 p-4 text-center">
                    <div className="text-sm text-slate-500">
                      선택한 권역에 학교가 없습니다.
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Step 3: 학년/과목 선택 */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-slate-900">학년과 과목을 선택하세요</h2>
                <button
                  onClick={() => {
                    setCurrentStep(2);
                    setSelectedGrade("");
                    setSelectedSubject("");
                  }}
                  className="text-sm font-medium text-slate-600 hover:text-slate-900"
                >
                  ← {selectedRole === "student" ? "정보 입력으로" : "정보 입력으로"}
                </button>
              </div>

              {/* 선택한 학교 요약 */}
              {selectedSchoolName && (
                <div className="rounded-lg bg-slate-100 px-4 py-3">
                  <div className="text-sm font-semibold text-slate-900">
                    선택한 학교: {selectedSchoolName}
                  </div>
                </div>
              )}

              <div className="grid gap-6 sm:grid-cols-2">
                {/* Grade */}
                <div>
                  <label className="block text-sm font-semibold text-slate-900 mb-2">
                    학년
                  </label>
                  <select
                    value={selectedGrade}
                    onChange={(e) => setSelectedGrade(e.target.value)}
                    className="w-full rounded-lg border-2 border-slate-300 bg-white px-4 py-3 text-base font-medium text-slate-900 focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-500"
                  >
                    <option value="" className="text-slate-500">
                      선택하세요
                    </option>
                    {availableGrades.map((g: { value: string; label: string }) => (
                      <option key={g.value} value={g.value} className="text-slate-900">
                        {g.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Subject */}
                <div>
                  <label className="block text-sm font-semibold text-slate-900 mb-2">
                    과목
                  </label>
                  <select
                    value={selectedSubject}
                    onChange={(e) => {
                      const selectedSubj = (SUBJECTS as readonly SubjectOption[]).find((s) => s.value === e.target.value);
                      // 준비중 과목은 선택 불가하도록 처리
                      if (selectedSubj && selectedSubj.enabled) {
                        setSelectedSubject(e.target.value);
                        setSelectedCategory("");
                      } else if (selectedSubj && !selectedSubj.enabled) {
                        // 준비중 과목 선택 시 알림 및 선택 취소
                        alert(`${selectedSubj.label}는 준비중입니다.`);
                        return;
                      } else {
                        setSelectedSubject(e.target.value);
                        setSelectedCategory("");
                      }
                    }}
                    className="w-full rounded-lg border-2 border-slate-300 bg-white px-4 py-3 text-base font-medium text-slate-900 focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-500"
                  >
                    <option value="" className="text-slate-500">
                      선택하세요
                    </option>
                    {(SUBJECTS as readonly SubjectOption[]).map((s: SubjectOption) => (
                      <option
                        key={s.value}
                        value={s.value}
                        disabled={!s.enabled}
                        className={`${s.enabled ? "text-slate-900" : "text-slate-400"}`}
                      >
                        {s.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Publisher Badge */}
              {textbookMap && (
                <div className="rounded-lg bg-slate-100 p-4">
                  <div className="text-sm font-semibold text-slate-900">
                    {textbookMap.map.schoolName} {formatGradeLabel(textbookMap.map.grade)}{" "}
                    {textbookMap.map.subject}
                  </div>
                  <div className="mt-1 text-xs text-slate-700">
                    {textbookMap.map.publisher || "동아출판사"} 스타일
                  </div>
                </div>
              )}

              {/* Next button when grade and subject are selected */}
              {selectedGrade && selectedSubject && selectedSubjectEnabled && textbookMap && (
                <button
                  onClick={() => setCurrentStep(4)}
                  className="w-full rounded-lg bg-slate-900 px-6 py-3 text-base font-semibold text-white transition-colors hover:bg-slate-800"
                >
                  유형 선택
                </button>
              )}
            </div>
          )}

          {/* Step 4: 카테고리 선택 */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-slate-900">유형을 선택하세요</h2>
                <button
                  onClick={() => {
                    setCurrentStep(3);
                    setSelectedCategory("");
                  }}
                  className="text-sm font-medium text-slate-600 hover:text-slate-900"
                >
                  ← 학년/과목 다시 선택
                </button>
              </div>

              {/* 선택 요약 */}
              <div className="rounded-lg bg-slate-100 px-4 py-3">
                <div className="text-sm font-semibold text-slate-900">
                  선택한 학교: {selectedSchoolName}
                </div>
                <div className="mt-1 text-xs text-slate-700">
                  {formatGradeLabel(selectedGrade)} · {selectedSubject}
                </div>
              </div>

              {/* 카테고리 체크박스 그리드 */}
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {ENGLISH_CATEGORIES.filter(c => c.key !== "midterm" && c.key !== "final").map((category) => (
                  <label
                    key={category.key}
                    className={`rounded-xl border-2 p-6 text-center transition-all cursor-pointer ${
                      selectedCategories.includes(category.key)
                        ? "border-slate-900 bg-slate-50"
                        : "border-slate-200 bg-white hover:border-slate-400 hover:bg-slate-50"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedCategories.includes(category.key)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedCategories([...selectedCategories, category.key]);
                        } else {
                          setSelectedCategories(selectedCategories.filter(c => c !== category.key));
                        }
                      }}
                      className="sr-only"
                    />
                    <div className="text-base font-semibold text-slate-900">
                      {category.label}
                    </div>
                  </label>
                ))}
              </div>
              
              {/* 선택된 카테고리 표시 및 다음 버튼 */}
              {selectedCategories.length > 0 && (
                <div className="mt-4">
                  <button
                    onClick={() => setCurrentStep(5)}
                    className="w-full rounded-lg bg-slate-900 px-6 py-3 text-base font-semibold text-white transition-colors hover:bg-slate-800"
                  >
                    다음 ({selectedCategories.length}개 선택됨)
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Step 5: 생성 */}
          {currentStep === 5 && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-slate-900">문제 생성</h2>
                <button
                  onClick={() => {
                    setCurrentStep(4);
                    setSelectedCategory("");
                  }}
                  className="text-sm font-medium text-slate-600 hover:text-slate-900"
                >
                  ← 유형 다시 선택
                </button>
              </div>

              {/* 선택 요약 */}
              <div className="rounded-lg bg-slate-100 px-4 py-3">
                <div className="text-sm font-semibold text-slate-900">
                  선택한 학교: {selectedSchoolName}
                </div>
                <div className="mt-1 text-xs text-slate-700">
                  {formatGradeLabel(selectedGrade)} · {selectedSubject} ·{" "}
                  {selectedCategories.length > 0 
                    ? selectedCategories.map(c => getCategoryLabel(c)).join(", ")
                    : getCategoryLabel(selectedCategory)}
                </div>
                {textbookMap && (
                  <div className="mt-1 text-xs text-slate-600">
                    {textbookMap.map.publisher || "동아출판사"} 스타일
                  </div>
                )}
              </div>

              {/* Generate Button */}
              <div className="space-y-3">
                {/* 개발자 모드 배지 */}
                {process.env.NODE_ENV === "development" && (
                  <div className="rounded-lg bg-purple-50 border border-purple-200 px-4 py-2 text-xs text-purple-700">
                    🔧 개발자 모드: 일일 한도 해제
                  </div>
                )}
                
                <button
                  onClick={handleGenerate}
                  disabled={!canGenerate}
                  className="w-full rounded-lg bg-slate-900 px-6 py-4 text-base font-semibold text-white transition-colors hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400 disabled:opacity-50"
                >
                  {loading
                    ? "생성 중..."
                    : cooldown
                      ? "잠시 후 다시 시도하세요"
                      : "문제 생성하기"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
