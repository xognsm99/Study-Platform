import { z } from "zod";

// Flash4 퀴즈 페이로드
export const Flash4PayloadSchema = z.object({
  focusWord: z.string(),
  choices: z.array(z.string()).length(4),
  answerIndex: z.number().int().min(0).max(3),
  decoys: z.array(z.string()).optional(), // 배경에 표시될 단어들
});

// Spell 퀴즈 페이로드
export const SpellPayloadSchema = z.object({
  prompt: z.string(), // 문장 (언더바 포함 가능)
  answer: z.string(), // 정답 단어
  meaning: z.string(), // 한글 뜻
  poolLetters: z.array(z.string()), // 사용 가능한 문자들 (정답 포함 + 오답)
});

// Binary Passage 퀴즈 페이로드
export const BinaryQuestionSchema = z.object({
  id: z.number(),
  text: z.string(),
  options: z.array(z.string()).length(2), // ["end", "ends"]
  answerIndex: z.number().int().min(0).max(1),
});

export const BinaryPassagePayloadSchema = z.object({
  passage: z.string(),
  questions: z.array(BinaryQuestionSchema).min(1),
});

// 퀴즈 아이템 통합 스키마
export const QuizItemSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("flash4"),
    payload: Flash4PayloadSchema,
  }),
  z.object({
    type: z.literal("spell"),
    payload: SpellPayloadSchema,
  }),
  z.object({
    type: z.literal("binaryPassage"),
    payload: BinaryPassagePayloadSchema,
  }),
]);

// 게임 세트 스키마
export const GameSetSchema = z.object({
  id: z.string().optional(),
  title: z.string(),
  grade: z.string(),
  is_active: z.boolean().default(true),
  items: z.array(QuizItemSchema),
});

// 타입 추출
export type Flash4Payload = z.infer<typeof Flash4PayloadSchema>;
export type SpellPayload = z.infer<typeof SpellPayloadSchema>;
export type BinaryQuestion = z.infer<typeof BinaryQuestionSchema>;
export type BinaryPassagePayload = z.infer<typeof BinaryPassagePayloadSchema>;
export type QuizItem = z.infer<typeof QuizItemSchema>;
export type GameSet = z.infer<typeof GameSetSchema>;

// 게임 세션 상태
export type GameSessionState = {
  currentIndex: number;
  answers: (number | string | null)[];
  startTime: number;
  endTime: number | null;
};

// 게임 결과
export type GameResult = {
  score: number;
  correctCount: number;
  totalCount: number;
  timeSpentSec: number;
  isPerfect: boolean;
};

