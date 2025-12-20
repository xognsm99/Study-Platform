"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import StudentProfileCard from "@/components/StudentProfileCard";
import { getMyProfile, upsertMyProfile, isProfileComplete, type StudentProfile } from "@/lib/profile";
import { supabaseBrowser } from "@/lib/supabase-browser";
import SchoolSearch from "@/components/SchoolSearch";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const GRADES = [
  { label: "중1", value: "1" },
  { label: "중2", value: "2" },
  { label: "중3", value: "3" },
] as const;

const UNIT_OPTIONS = [
  "1~3단원",
  "중간고사",
  "4~6단원",
  "기말고사",
  "종합평가",
] as const;

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

const SUBREGION_OPTIONS: Record<string, string[]> = {
  "서울": ["전체"],
  "경기": ["전체", "경기도", "인천광역시"],
  "전라": ["전체", "전라북도", "전라남도", "광주광역시"],
  "충청": ["전체", "충청북도", "충청남도", "대전광역시", "세종특별자치시"],
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

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // 폼 state
  const [regionGroup, setRegionGroup] = useState<string>("서울");
  const [subRegion, setSubRegion] = useState<string>("");
  const [grade, setGrade] = useState<string>("2");
  const [subject, setSubject] = useState<string>("영어");
  const [unitRange, setUnitRange] = useState<string>(UNIT_OPTIONS[0]);
  const [selectedSchool, setSelectedSchool] = useState<{
    code: string;
    name: string;
    location?: string;
  } | null>(null);

  // 로그인 확인 및 프로필 로드
  useEffect(() => {
    const supabase = supabaseBrowser();

    // 초기 세션 확인
    supabase.auth.getSession().then(({ data }) => {
      const user = data.session?.user ?? null;
      if (!user) {
        router.push("/auth");
        return;
      }
      setIsLoggedIn(true);
      setLoading(false);
    });

    // 인증 상태 변경 구독
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session?.user) {
        router.push("/auth");
        return;
      }
      setIsLoggedIn(true);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [router]);

  // 프로필 로드 (로그인 확인 후)
  useEffect(() => {
    if (!isLoggedIn) return;

    async function loadProfile() {
      try {
        const supabase = supabaseBrowser();
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) return;

        const data = await getMyProfile(user.id);
        setProfile(data);

        if (data) {
          setRegionGroup(data.region || "서울");
          setSubRegion(data.district || "");
          setGrade(data.grade || "2");
          setSubject(data.subject || "영어");
          setUnitRange(data.term || UNIT_OPTIONS[0]);
          if (data.school && data.school_code) {
            setSelectedSchool({
              code: data.school_code,
              name: data.school,
              location: data.region || undefined,
            });
          }
        }

        setShowForm(!isProfileComplete(data));
      } catch (e) {
        console.error("[ProfilePage] 로드 실패:", e);
        setError("프로필을 불러오는 중 오류가 발생했습니다.");
      }
    }
    loadProfile();
  }, [isLoggedIn]);

  const subRegionOptions = (() => {
    if (regionGroup === "서울") return SEOUL_GU;
    if (regionGroup === "경기") {
      return ["인천", ...GYEONGGI_CITIES.filter((x) => x !== "인천" && x !== "인천광역시")];
    }
    return SUBREGION_OPTIONS[regionGroup] || [];
  })();

  const handleSave = async () => {
    if (!selectedSchool) {
      setError("학교를 선택해주세요.");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const supabase = supabaseBrowser();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setError("로그인이 필요합니다.");
        setSaving(false);
        return;
      }

      const result = await upsertMyProfile(
        {
          region: regionGroup,
          district: subRegion || null,
          school: selectedSchool.name,
          school_code: selectedSchool.code,
          grade: grade,
          subject: subject,
          term: unitRange,
        },
        user.id
      );

      if (result.success) {
        const updatedProfile = await getMyProfile(user.id);
        setProfile(updatedProfile);
        setShowForm(false);
      } else {
        setError(result.error || "프로필 저장에 실패했습니다.");
      }
    } catch (e: any) {
      setError(e?.message || "프로필 저장 중 오류가 발생했습니다.");
    } finally {
      setSaving(false);
    }
  };

  if (loading || !isLoggedIn) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
        <div className="mx-auto max-w-xl px-6 py-10">
          <div className="text-center text-neutral-600">로딩 중...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      <div className="mx-auto max-w-xl px-6 py-10">
        <h1 className="text-2xl font-bold text-gray-900">내 프로필</h1>

        {/* 프로필 정보 카드 */}
        {!showForm && profile && isProfileComplete(profile) && (
          <div className="mt-8">
            <StudentProfileCard
              profile={profile}
              onEdit={() => setShowForm(true)}
            />
          </div>
        )}

        {/* 프로필 편집 폼 */}
        {showForm && (
          <Card className="mt-8">
            <CardHeader>
              <CardTitle className="text-lg">프로필 설정</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
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
                    }}
                    className="w-full h-10 rounded-lg border border-gray-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                    }}
                    className="w-full h-10 rounded-lg border border-gray-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={subRegionOptions.length === 0}
                  >
                    {regionGroup !== "서울" && regionGroup !== "경기" && (
                      <option value="">전체</option>
                    )}
                    {subRegionOptions.map((x) => (
                      <option key={x} value={x}>
                        {x}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-800">
                    학년
                  </label>
                  <select
                    value={grade}
                    onChange={(e) => setGrade(e.target.value)}
                    className="w-full h-10 rounded-lg border border-gray-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {GRADES.map((g) => (
                      <option key={g.value} value={g.value}>
                        {g.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-800">
                    과목
                  </label>
                  <input
                    value={subject}
                    readOnly
                    className="w-full h-10 rounded-lg border border-gray-300 px-3 text-sm bg-gray-50"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium mb-2 text-gray-800">
                    단원
                  </label>
                  <select
                    value={unitRange}
                    onChange={(e) => setUnitRange(e.target.value)}
                    className="w-full h-10 rounded-lg border border-gray-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {UNIT_OPTIONS.map((op) => (
                      <option key={op} value={op}>
                        {op}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-gray-800">
                  학교
                </label>
                <SchoolSearch
                  region={regionGroup}
                  gu={subRegion === "전체" ? "" : subRegion}
                  onSelect={(s) => {
                    setSelectedSchool({
                      code: s.schoolCode,
                      name: s.name,
                      location: regionGroup,
                    });
                  }}
                />
              </div>

              {error && (
                <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
                  {error}
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <Button
                  onClick={handleSave}
                  disabled={saving || !selectedSchool}
                  className="flex-1 bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-300"
                >
                  {saving ? "저장 중..." : "저장"}
                </Button>
                {profile && isProfileComplete(profile) && (
                  <Button
                    onClick={() => setShowForm(false)}
                    variant="outline"
                    className="flex-1"
                  >
                    취소
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

