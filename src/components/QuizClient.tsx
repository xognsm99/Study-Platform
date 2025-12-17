"use client";

import { DEFAULT_QUIZ_SIZE, getCategoryLabel, normalizeCategory } from "@/lib/utils/constants";
import SingleQuizClient from "./SingleQuizClient";
import TripleQuizClient from "./TripleQuizClient";

export type ProblemItem = {
  id: string;
  question: string;
  choices: string[];
  answerIndex: number;
  explanation: string;

  // "easy" | "medium" | "hard"
  difficulty?: string;

  // 자주 출제 여부
  frequent?: boolean;

  // (선택) 오답용 상세 해설이 나중에 오면 사용
  explanationWrong?: string;

  // 시험 모드 타입 (vocab, grammar, body, dialogue 등)
  type?: string;

  // 지문 (passage)
  passage?: string;

  // 원본 content 데이터
  content?: any;

  // ✅ 연습용 플래그 (보기/정답 없어서 채점 불가)
  isPracticeMode?: boolean;
};

type Props = {
  grade: string;
  subject: string;
  category: string;
  initialProblems?: ProblemItem[]; // 학생 모드에서 미리 로드한 문제
  categories?: string[]; // 여러 카테고리 선택 시
};

/**
 * QuizClient - 라우팅 컴포넌트
 * isTripleMode에 따라 SingleQuizClient 또는 TripleQuizClient로 분기
 */
export default function QuizClient({ grade, subject, category, initialProblems, categories }: Props) {
  // ✅ 모드 결정
  const isExamMode = category === "midterm" || category === "final";
  // Triple 모드는 독해(reading) / 대화문(dialogue)만 사용
  const isTripleMode = !isExamMode && (category === "reading" || category === "dialogue");

  // ✅ 모드에 따라 적절한 컴포넌트 렌더링 (Hook은 각 컴포넌트 내부에서 처리)
  return isTripleMode ? (
    <TripleQuizClient grade={grade} subject={subject} category={category} categories={categories} />
  ) : (
    <SingleQuizClient grade={grade} subject={subject} category={category} initialProblems={initialProblems} categories={categories} />
  );
}