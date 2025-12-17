/**
 * 문제 관련 상수 정의
 * 프론트엔드, 서버, 시드 스크립트에서 공통으로 사용
 */

// 카테고리 상수
export const CATEGORY = {
  DIALOGUE: "dialogue",
  VOCABULARY: "vocabulary",
  READING: "reading",
} as const;

export type Category = typeof CATEGORY[keyof typeof CATEGORY];

// 카테고리 표시명 매핑
export const CATEGORY_LABELS: Record<Category, string> = {
  [CATEGORY.DIALOGUE]: "대화문",
  [CATEGORY.VOCABULARY]: "어휘",
  [CATEGORY.READING]: "독해",
};

// 문제 타입 상수
export const QUESTION_TYPE = {
  // 대화문
  DIALOGUE_FLOW_ODD_SENTENCE: "dialogue_flow_odd_sentence",
  DIALOGUE_FLOW_AWKWARD: "dialogue_flow_awkward",
  DIALOGUE_BLANK_QUESTION: "dialogue_blank_question",
  
  // 어휘
  VOCAB_DEFINITION_MATCH: "vocab_definition_match",
  
  // 독해
  READING_TITLE_BEST: "reading_title_best",
  READING_TITLE: "reading_title",
} as const;

export type QuestionType = typeof QUESTION_TYPE[keyof typeof QUESTION_TYPE];

// 과목 코드 상수
export const SUBJECT_CODE = {
  ENGLISH: "english",
  KOREAN: "korean",
  SOCIAL: "social",
} as const;

export type SubjectCode = typeof SUBJECT_CODE[keyof typeof SUBJECT_CODE];

// 과목 표시명 매핑
export const SUBJECT_LABELS: Record<SubjectCode, string> = {
  [SUBJECT_CODE.ENGLISH]: "영어",
  [SUBJECT_CODE.KOREAN]: "국어",
  [SUBJECT_CODE.SOCIAL]: "사회",
};

// 과목 정규화 함수 (입력값을 표준 코드로 변환)
export function normalizeSubject(input: any): SubjectCode | undefined {
  if (!input) return undefined;
  const str = String(input).trim();
  const strLower = str.toLowerCase();
  
  // 다양한 입력 형식 지원 (한글 우선, 대소문자 무시)
  if (strLower === "영어" || strLower === "english" || strLower === "eng") {
    return SUBJECT_CODE.ENGLISH;
  }
  if (strLower === "국어" || strLower === "korean" || strLower === "kor") {
    return SUBJECT_CODE.KOREAN;
  }
  if (strLower === "사회" || strLower === "social" || strLower === "soc") {
    return SUBJECT_CODE.SOCIAL;
  }
  
  // 이미 표준 코드인 경우 (대소문자 무시)
  const normalized = strLower as SubjectCode;
  if (Object.values(SUBJECT_CODE).includes(normalized)) {
    return normalized;
  }
  
  return undefined;
}

// 학년 정규화 함수 (입력값을 숫자로 변환)
export function normalizeGrade(input: any): number | undefined {
  if (input == null) return undefined;
  if (typeof input === "number") return input;
  
  const str = String(input).trim();
  // "중2", "2학년", "2" 모두 2로 변환
  const num = Number(str.replace(/\D/g, ""));
  return Number.isFinite(num) && num > 0 ? num : undefined;
}

// 카테고리 정규화 함수
export function normalizeCategory(input: string): Category {
  if (!input) return CATEGORY.DIALOGUE;
  
  const str = String(input).trim().toLowerCase();
  
  // 다양한 입력 형식 지원 (한글 우선)
  if (["dialogue", "대화문", "conversation", "dialog", "대화"].includes(str)) {
    return CATEGORY.DIALOGUE;
  }
  if (["vocab", "vocabulary", "word", "어휘", "단어"].includes(str)) {
    return CATEGORY.VOCABULARY;
  }
  if (["reading", "read", "독해", "읽기"].includes(str)) {
    return CATEGORY.READING;
  }
  
  // 이미 표준 카테고리인 경우
  if (Object.values(CATEGORY).includes(str as Category)) {
    return str as Category;
  }
  
  // 기본값 (dialogue)
  return CATEGORY.DIALOGUE;
}

// 출판사 정규화 함수
export function normalizePublisher(input: any): string | undefined {
  if (!input) return undefined;
  return String(input).trim();
}

// 학교 정규화 함수
export function normalizeSchool(input: any): string | undefined {
  if (!input) return undefined;
  return String(input).trim();
}

