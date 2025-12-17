/**
 * 학교 교과서 매핑 유틸리티
 */
import { GIMHAE_SCHOOL_TEXTBOOKS } from "@/data/gimhae_school_textbooks";
import { normalizeSubject, SUBJECT_CODE } from "@/lib/problem-constants";

/**
 * 학교/학년/과목으로 출판사 조회
 * @param schoolName 학교명
 * @param grade 학년 (숫자)
 * @param subject 과목 코드 ("english", "korean", "social" 등)
 * @returns 출판사명 또는 undefined
 */
export function getPublisherBySchool(
  schoolName: string,
  grade: number,
  subject: string
): string | undefined {
  if (!schoolName || !grade || !subject) return undefined;

  // 과목 정규화 (영어/english 모두 처리)
  const normalizedSubject = normalizeSubject(subject);
  if (!normalizedSubject) return undefined;

  // gimhae_school_textbooks.ts의 subject는 "English", "Korean", "Social" (대문자)
  const subjectMap: Record<string, string> = {
    [SUBJECT_CODE.ENGLISH]: "English",
    [SUBJECT_CODE.KOREAN]: "Korean",
    [SUBJECT_CODE.SOCIAL]: "Social",
  };

  const dbSubject = subjectMap[normalizedSubject];
  if (!dbSubject) return undefined;

  // 매핑 데이터에서 찾기
  const match = GIMHAE_SCHOOL_TEXTBOOKS.find(
    (item) =>
      item.school_name === schoolName &&
      item.grade === grade &&
      item.subject === dbSubject
  );

  return match?.publisher;
}

/**
 * 학교 목록 가져오기
 */
export function getSchoolList(): string[] {
  return Array.from(
    new Set(GIMHAE_SCHOOL_TEXTBOOKS.map((item) => item.school_name))
  ).sort();
}

