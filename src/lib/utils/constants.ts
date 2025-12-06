export const GRADES = ["중1", "중2", "중3", "고1", "고2", "고3"] as const;

export const SUBJECTS = [
  { key: "english", label: "영어", enabled: true },
  { key: "math", label: "수학", enabled: true },
  { key: "korean", label: "국어", enabled: false },
  { key: "science", label: "과학", enabled: false },
] as const;

export const ENGLISH_CATEGORIES = [
  { key: "midterm", label: "중간고사" },
  { key: "final", label: "기말고사" },
  { key: "vocab", label: "어휘" },
  { key: "grammar", label: "문법" },
  { key: "reading", label: "독해" },
  { key: "writing", label: "서술" },
] as const;

export const DEFAULT_CHOICE_COUNT = 4; // MVP는 4지선다
export const DEFAULT_QUIZ_SIZE = 10;
