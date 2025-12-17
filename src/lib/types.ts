export type Publisher =
  | "동아출판"
  | "천재교육"
  | "비상교육"
  | "YBM"
  | "능률"
  | "기타";

export type ExamTermLabel = "중간고사" | "기말고사";

export type ExamStyle = {
  // 객관식/단답형 비율 힌트(서버 프롬프트에만 사용)
  mcqRatio?: number;          // default 0.85
  shortAnswerRatio?: number; // default 0.15
  avoidLongEssay?: boolean;  // default true
};

export type ExamMeta = {
  year?: number;          // 예: 2026
  month?: number;         // 예: 5
  termLabel?: ExamTermLabel;

  publisher?: Publisher;  // "동아출판" 등
  range?: string;         // "1~3과", "Lesson 1-3", "2단원 전체" 등

  unitFocus?: string[];   // ["관계대명사", "가정법", "Lesson 1~3 핵심 어휘"]
  style?: ExamStyle;
};

