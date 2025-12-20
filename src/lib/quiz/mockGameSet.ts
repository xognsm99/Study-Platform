import type { GameSet } from "./schema";

// MVP용 Mock 게임 세트 (flash4 10문제)
export const mockGameSet: GameSet = {
  title: "오늘의 5분 미션",
  grade: "middle2",
  is_active: true,
  items: [
    {
      type: "flash4",
      payload: {
        focusWord: "involve",
        choices: ["포함시키다", "기여하다", "동의하다", "더 잘하다"],
        answerIndex: 0,
        decoys: ["imagine", "agree", "believe", "important", "honest"],
      },
    },
    {
      type: "flash4",
      payload: {
        focusWord: "achieve",
        choices: ["달성하다", "도착하다", "시작하다", "포기하다"],
        answerIndex: 0,
        decoys: ["arrive", "begin", "abandon", "accept", "accident"],
      },
    },
    {
      type: "flash4",
      payload: {
        focusWord: "require",
        choices: ["요구하다", "제거하다", "거절하다", "회복하다"],
        answerIndex: 0,
        decoys: ["remove", "refuse", "recover", "remember", "realize"],
      },
    },
    {
      type: "flash4",
      payload: {
        focusWord: "consider",
        choices: ["고려하다", "건설하다", "소비하다", "제한하다"],
        answerIndex: 0,
        decoys: ["construct", "consume", "contain", "continue", "control"],
      },
    },
    {
      type: "flash4",
      payload: {
        focusWord: "develop",
        choices: ["발전시키다", "설명하다", "발견하다", "설계하다"],
        answerIndex: 0,
        decoys: ["describe", "discover", "design", "decide", "discuss"],
      },
    },
    {
      type: "flash4",
      payload: {
        focusWord: "prevent",
        choices: ["방지하다", "제공하다", "준비하다", "예측하다"],
        answerIndex: 0,
        decoys: ["provide", "prepare", "predict", "present", "prefer"],
      },
    },
    {
      type: "flash4",
      payload: {
        focusWord: "suggest",
        choices: ["제안하다", "성공하다", "고통받다", "고소하다"],
        answerIndex: 0,
        decoys: ["succeed", "suffer", "sue", "supply", "support"],
      },
    },
    {
      type: "flash4",
      payload: {
        focusWord: "improve",
        choices: ["개선하다", "수입하다", "영향을 주다", "포함하다"],
        answerIndex: 0,
        decoys: ["import", "influence", "include", "inform", "intend"],
      },
    },
    {
      type: "flash4",
      payload: {
        focusWord: "recognize",
        choices: ["인식하다", "기록하다", "추천하다", "회복하다"],
        answerIndex: 0,
        decoys: ["record", "recommend", "recover", "reduce", "refer"],
      },
    },
    {
      type: "flash4",
      payload: {
        focusWord: "establish",
        choices: ["설립하다", "추정하다", "평가하다", "존재하다"],
        answerIndex: 0,
        decoys: ["estimate", "evaluate", "exist", "expand", "expect"],
      },
    },
  ],
};

