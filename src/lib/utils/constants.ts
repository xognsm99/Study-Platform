export const GRADES = ["중1", "중2", "중3", "고1", "고2", "고3"] as const;

export const SUBJECTS = [
  { key: "english", label: "영어", enabled: true },
  { key: "math", label: "수학", enabled: true },
  { key: "korean", label: "국어", enabled: false },
  { key: "science", label: "과학", enabled: false },
] as const;

// ✅ 표준 카테고리 매핑 (앱 전역 표준)
export const CATEGORY_MAP = {
  // 표준 value (라우트/API 요청용)
  midterm: "중간고사",
  final: "기말고사",
  vocab: "어휘",
  grammar: "문법",
  body: "본문",
  dialogue: "대화문",
} as const;

// 카테고리 목록 (UI 선택용)
export const ENGLISH_CATEGORIES = [
  { key: "midterm", label: CATEGORY_MAP.midterm },
  { key: "final", label: CATEGORY_MAP.final },
  { key: "vocab", label: CATEGORY_MAP.vocab },
  { key: "grammar", label: CATEGORY_MAP.grammar },
  { key: "body", label: CATEGORY_MAP.body },
  { key: "dialogue", label: CATEGORY_MAP.dialogue },
] as const;

// 레거시 카테고리 매핑 (호환성 유지) - 영문 + 한글 모두 포함
export const LEGACY_CATEGORY_MAP: Record<string, string> = {
  reading: "body",  // 독해 → 본문
  writing: "dialogue", // 서술 → 대화문
  독해: "body",
  서술: "dialogue",
};

// 카테고리 정규화 함수 (레거시 값 → 표준 value 변환)
export function normalizeCategory(raw?: string | null): string {
  if (!raw) return raw || "";
  const normalized = LEGACY_CATEGORY_MAP[raw] || raw;
  return normalized;
}

// 카테고리 라벨 조회 함수 (항상 표준 label 반환)
export function getCategoryLabel(category: string | null | undefined): string {
  if (!category) return "";
  const normalized = normalizeCategory(category);
  return CATEGORY_MAP[normalized as keyof typeof CATEGORY_MAP] || normalized;
}

// 카테고리가 유효한 표준 카테고리인지 확인
export function isValidCategory(category: string): boolean {
  const normalized = normalizeCategory(category);
  return normalized in CATEGORY_MAP;
}

export const DEFAULT_CHOICE_COUNT = 5; // MVP는 4지선다
export const DEFAULT_QUIZ_SIZE = 10;
