// -------------------------
// ✅ 시험 메타 정보 타입 정의
// -------------------------
export type ExamMeta = {
  schoolName?: string;
  grade: string;
  subject: string;
  category: string;
  year?: number;
  semester?: number;
  termLabel?: "중간고사" | "기말고사";
};

// -------------------------
// ✅ 시험지 제목 생성 함수
// -------------------------
export function buildExamTitle(meta: ExamMeta): string {
  const { schoolName, grade, subject, category, year, semester, termLabel } = meta;

  const subjectLabel = subject === "english" ? "영어" : subject === "math" ? "수학" : subject;
  const categoryLabel = category === "midterm" ? "중간고사" : category === "final" ? "기말고사" : category;

  const parts: string[] = [];

  if (schoolName) {
    parts.push(schoolName);
  }

  parts.push(grade);

  parts.push(subjectLabel);

  if (year && semester) {
    parts.push(`${year}년 ${semester}학기`);
  } else if (year) {
    parts.push(`${year}년`);
  }

  parts.push(categoryLabel || termLabel || "");

  return parts.filter(Boolean).join(" ");
}

// -------------------------
// ✅ 플레이스홀더 문제인지 확인
// -------------------------
export function isPlaceholderQuestion(problem: {
  question?: string;
  choices?: string[];
  id?: string;
}): boolean {
  if (!problem) return true;

  // 선택지가 "선택지 1", "선택지 2" 같은 패턴인지 확인
  if (Array.isArray(problem.choices)) {
    const isPlaceholderChoice = problem.choices.some((choice) => {
      const normalized = String(choice).trim();
      return /^선택지\s*\d+$/.test(normalized);
    });

    if (isPlaceholderChoice) return true;
  }

  // 문제 텍스트가 비어있거나 placeholder 패턴인지 확인
  const question = String(problem.question || "").trim();
  if (!question || question.length < 5) return true;

  // ID가 template으로 시작하는지 확인
  if (problem.id && String(problem.id).startsWith("template-")) {
    // 단, 실제 내용이 있는 템플릿은 허용
    if (question.length > 10 && Array.isArray(problem.choices) && problem.choices.length > 0) {
      const hasRealChoices = problem.choices.some((c) => {
        const text = String(c).trim();
        return text.length > 5 && !/^선택지\s*\d+$/.test(text);
      });
      if (hasRealChoices) return false;
    }
    return true;
  }

  return false;
}

// -------------------------
// ✅ 유효한 문제인지 확인
// -------------------------
export function isValidProblem(problem: {
  question?: string;
  choices?: string[];
  answerIndex?: number;
}): boolean {
  if (!problem) return false;

  const question = String(problem.question || "").trim();
  if (!question || question.length < 5) return false;

  if (!Array.isArray(problem.choices) || problem.choices.length < 4) return false;

  // 모든 선택지가 실제 내용을 가지고 있는지 확인
  const hasRealChoices = problem.choices.every((c) => {
    const text = String(c).trim();
    return text.length > 3 && !/^선택지\s*\d+$/.test(text);
  });

  if (!hasRealChoices) return false;

  const answerIndex = problem.answerIndex;
  if (typeof answerIndex !== "number" || answerIndex < 0 || answerIndex >= problem.choices.length) {
    return false;
  }

  return true;
}

