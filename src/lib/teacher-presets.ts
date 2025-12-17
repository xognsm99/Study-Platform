export type PresetKey = "balanced" | "vocab_focus" | "dialogue_focus" | "reading_focus";

export type CategoryCounts = {
  dialogue: number;
  vocabulary: number;
  grammar: number;
  reading: number;
};

export interface TeacherPreset {
  key: PresetKey;
  label: string;
  description: string;
  counts: CategoryCounts;
}

export const TEACHER_PRESETS: Record<PresetKey, TeacherPreset> = {
  balanced: {
    key: "balanced",
    label: "기본 내신형",
    description: "어휘/대화문/문법/본문 균형 배분",
    counts: {
      vocabulary: 4,
      dialogue: 6,
      grammar: 4,
      reading: 6,
    },
  },
  vocab_focus: {
    key: "vocab_focus",
    label: "어휘 집중형",
    description: "어휘 비중 확대",
    counts: {
      vocabulary: 8,
      dialogue: 4,
      grammar: 4,
      reading: 4,
    },
  },
  dialogue_focus: {
    key: "dialogue_focus",
    label: "대화 집중형",
    description: "대화문 비중 확대",
    counts: {
      vocabulary: 4,
      dialogue: 8,
      grammar: 4,
      reading: 4,
    },
  },
  reading_focus: {
    key: "reading_focus",
    label: "본문 집중형",
    description: "본문 비중 확대",
    counts: {
      vocabulary: 4,
      dialogue: 4,
      grammar: 4,
      reading: 8,
    },
  },
};

export function getPreset(key: PresetKey): TeacherPreset {
  return TEACHER_PRESETS[key];
}

export function getPresetCounts(key: PresetKey): CategoryCounts {
  return TEACHER_PRESETS[key].counts;
}

