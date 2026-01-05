/**
 * 퀴즈 출제 범위 유틸리티
 * - 프로필에 저장된 quiz_scope를 units 배열로 변환
 * - 12단원(u1~u12) + 시험범위(mid1/final1/mid2/final2/overall) 지원
 */

export const ALL_UNITS = [
  "u1",
  "u2",
  "u3",
  "u4",
  "u5",
  "u6",
  "u7",
  "u8",
  "u9",
  "u10",
  "u11",
  "u12",
] as const;

export type QuizScope =
  | "u1"
  | "u2"
  | "u3"
  | "u4"
  | "u5"
  | "u6"
  | "u7"
  | "u8"
  | "u9"
  | "u10"
  | "u11"
  | "u12"
  | "mid1"
  | "final1"
  | "mid2"
  | "final2"
  | "overall";

/**
 * 출제 범위를 단원 배열로 변환
 *
 * 규칙:
 * - u1~u12: 해당 단원만
 * - mid1(1학기 중간고사): u1~u3
 * - final1(1학기 기말고사): u1~u6
 * - mid2(2학기 중간고사): u7~u9
 * - final2(2학기 기말고사): u7~u12
 * - overall(종합평가): u1~u12
 */
export function scopeToUnits(scope: QuizScope): string[] {
  switch (scope) {
    // 단일 단원
    case "u1":
      return ["u1"];
    case "u2":
      return ["u2"];
    case "u3":
      return ["u3"];
    case "u4":
      return ["u4"];
    case "u5":
      return ["u5"];
    case "u6":
      return ["u6"];
    case "u7":
      return ["u7"];
    case "u8":
      return ["u8"];
    case "u9":
      return ["u9"];
    case "u10":
      return ["u10"];
    case "u11":
      return ["u11"];
    case "u12":
      return ["u12"];

    // 시험 범위
    case "mid1": // 1학기 중간고사
      return ["u1", "u2", "u3"];
    case "final1": // 1학기 기말고사
      return ["u1", "u2", "u3", "u4", "u5", "u6"];
    case "mid2": // 2학기 중간고사
      return ["u7", "u8", "u9"];
    case "final2": // 2학기 기말고사
      return ["u7", "u8", "u9", "u10", "u11", "u12"];
    case "overall": // 종합평가
      return ["u1", "u2", "u3", "u4", "u5", "u6", "u7", "u8", "u9", "u10", "u11", "u12"];

    default:
      // 기본값: u1
      return ["u1"];
  }
}

/**
 * scope 값의 유효성 검사
 */
export function isValidScope(value: any): value is QuizScope {
  const validScopes: QuizScope[] = [
    "u1", "u2", "u3", "u4", "u5", "u6",
    "u7", "u8", "u9", "u10", "u11", "u12",
    "mid1", "final1", "mid2", "final2", "overall",
  ];
  return typeof value === "string" && validScopes.includes(value as QuizScope);
}

/**
 * quiz_scope 문자열을 units 배열로 파싱
 *
 * @param quizScope - "mid1" | "u1,u3,u5" | "" | null 등
 * @returns units 배열 (예: ["u1", "u2", "u3"])
 *
 * 처리 규칙:
 * 1. mid1/final1/mid2/final2/overall → scopeToUnits 사용
 * 2. "u1,u3,u5" 같은 콤마 문자열 → 파싱하여 배열로
 * 3. 빈 값/null → 기본값 ["u1"]
 */
export function parseQuizScope(quizScope: string | null | undefined): string[] {
  if (!quizScope) {
    return ["u1"];
  }

  // 시험 범위인 경우
  if (isValidScope(quizScope)) {
    return scopeToUnits(quizScope);
  }

  // 콤마로 구분된 커스텀 units인 경우
  if (quizScope.includes(",")) {
    const units = quizScope
      .split(",")
      .map(u => u.trim())
      .filter(u => ALL_UNITS.includes(u as any));

    return units.length > 0 ? units : ["u1"];
  }

  // 단일 unit인 경우 (예: "u1")
  if (ALL_UNITS.includes(quizScope as any)) {
    return [quizScope];
  }

  // 기타 잘못된 값
  return ["u1"];
}

/**
 * 시험 범위에서 units 배열로 변환
 * @param examType - "mid1" | "final1" | "mid2" | "final2" | "overall"
 */
export function examToUnits(examType: string): string[] {
  switch (examType) {
    case "mid1":
      return ["u1", "u2", "u3"];
    case "final1":
      return ["u1", "u2", "u3", "u4", "u5", "u6"];
    case "mid2":
      return ["u7", "u8", "u9"];
    case "final2":
      return ["u7", "u8", "u9", "u10", "u11", "u12"];
    case "overall":
      return ["u1", "u2", "u3", "u4", "u5", "u6", "u7", "u8", "u9", "u10", "u11", "u12"];
    default:
      return [];
  }
}
