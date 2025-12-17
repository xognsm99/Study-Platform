/**
 * 선생님 전용: 프리셋에서 시험 계획(카테고리별 문제 개수) 생성
 * 학생 로직을 참조하지 않고 선생님 전용으로 독립적으로 구현
 */

import { type PresetKey, type CategoryCounts } from "@/lib/teacher-presets";

/**
 * 프리셋 키를 받아서 카테고리별 문제 개수를 반환
 * @param preset - 프리셋 키 ("balanced" | "vocab_focus" | "dialogue_focus" | "reading_focus")
 * @returns 카테고리별 문제 개수
 */
export function buildExamPlan(preset: PresetKey): CategoryCounts {
  const plans: Record<PresetKey, CategoryCounts> = {
    balanced: {
      vocabulary: 4,
      dialogue: 6,
      grammar: 4,
      reading: 6,
    },
    vocab_focus: {
      vocabulary: 8,
      dialogue: 4,
      grammar: 4,
      reading: 4,
    },
    dialogue_focus: {
      vocabulary: 4,
      dialogue: 8,
      grammar: 4,
      reading: 4,
    },
    reading_focus: {
      vocabulary: 4,
      dialogue: 4,
      grammar: 4,
      reading: 8,
    },
  };

  return plans[preset] || plans.balanced;
}

