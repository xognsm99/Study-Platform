/**
 * 어휘/숙어 게임 문제 데이터 타입 및 샘플
 * 
 * 추후 Supabase DB 또는 엑셀에서 가져올 때는 이 타입을 유지하면 됩니다.
 */

export type VocabGameItem = {
  id: string;
  sentence: string; // 빈칸은 () 형태 (예: "I go to school () every day.")
  answers: string[]; // 빈칸별 정답 (순서대로)
  distractors?: string[]; // 키보드용 오답 글자/단어(선택)
  translation?: string; // 한글 해석
  level?: "m1" | "m2" | "m3"; // 학년 (middle1, middle2, middle3)
};

/**
 * 샘플 문제 데이터 (30개)
 * 추후 Supabase의 vocab_keypad_problems 테이블 또는 엑셀에서 가져오도록 교체 가능
 */
export const VOCAB_GAME_SAMPLE: VocabGameItem[] = [
  {
    id: "vocab-001",
    sentence: "I () to school every day.",
    answers: ["go"],
    translation: "나는 매일 학교에 간다.",
    level: "m2",
  },
  {
    id: "vocab-002",
    sentence: "She () very early in the morning.",
    answers: ["wakes"],
    translation: "그녀는 아침에 매우 일찍 일어난다.",
    level: "m2",
  },
  {
    id: "vocab-003",
    sentence: "We () English at school.",
    answers: ["study"],
    translation: "우리는 학교에서 영어를 공부한다.",
    level: "m2",
  },
  {
    id: "vocab-004",
    sentence: "He () his homework every day.",
    answers: ["does"],
    translation: "그는 매일 숙제를 한다.",
    level: "m2",
  },
  {
    id: "vocab-005",
    sentence: "They () to the library after school.",
    answers: ["go"],
    translation: "그들은 방과 후 도서관에 간다.",
    level: "m2",
  },
  {
    id: "vocab-006",
    sentence: "I () a book in the library.",
    answers: ["read"],
    translation: "나는 도서관에서 책을 읽는다.",
    level: "m2",
  },
  {
    id: "vocab-007",
    sentence: "She () her friends at the park.",
    answers: ["meets"],
    translation: "그녀는 공원에서 친구들을 만난다.",
    level: "m2",
  },
  {
    id: "vocab-008",
    sentence: "We () lunch at 12 o'clock.",
    answers: ["have"],
    translation: "우리는 12시에 점심을 먹는다.",
    level: "m2",
  },
  {
    id: "vocab-009",
    sentence: "He () his room every weekend.",
    answers: ["cleans"],
    translation: "그는 매주말 방을 청소한다.",
    level: "m2",
  },
  {
    id: "vocab-010",
    sentence: "They () soccer on Sundays.",
    answers: ["play"],
    translation: "그들은 일요일에 축구를 한다.",
    level: "m2",
  },
  {
    id: "vocab-011",
    sentence: "I () TV in the evening.",
    answers: ["watch"],
    translation: "나는 저녁에 TV를 본다.",
    level: "m2",
  },
  {
    id: "vocab-012",
    sentence: "She () music every day.",
    answers: ["listens"],
    translation: "그녀는 매일 음악을 듣는다.",
    level: "m2",
  },
  {
    id: "vocab-013",
    sentence: "We () to the store to buy food.",
    answers: ["go"],
    translation: "우리는 음식을 사기 위해 가게에 간다.",
    level: "m2",
  },
  {
    id: "vocab-014",
    sentence: "He () his breakfast at 7 a.m.",
    answers: ["eats"],
    translation: "그는 오전 7시에 아침을 먹는다.",
    level: "m2",
  },
  {
    id: "vocab-015",
    sentence: "They () their bikes to school.",
    answers: ["ride"],
    translation: "그들은 학교까지 자전거를 탄다.",
    level: "m2",
  },
  {
    id: "vocab-016",
    sentence: "I () my teeth before bed.",
    answers: ["brush"],
    translation: "나는 잠자기 전에 이를 닦는다.",
    level: "m2",
  },
  {
    id: "vocab-017",
    sentence: "She () her homework in the afternoon.",
    answers: ["finishes"],
    translation: "그녀는 오후에 숙제를 끝낸다.",
    level: "m2",
  },
  {
    id: "vocab-018",
    sentence: "We () English with our teacher.",
    answers: ["practice"],
    translation: "우리는 선생님과 함께 영어를 연습한다.",
    level: "m2",
  },
  {
    id: "vocab-019",
    sentence: "He () his family on weekends.",
    answers: ["visits"],
    translation: "그는 주말에 가족을 방문한다.",
    level: "m2",
  },
  {
    id: "vocab-020",
    sentence: "They () to music while studying.",
    answers: ["listen"],
    translation: "그들은 공부하면서 음악을 듣는다.",
    level: "m2",
  },
  {
    id: "vocab-021",
    sentence: "I () my room every morning.",
    answers: ["tidy"],
    translation: "나는 매일 아침 방을 정리한다.",
    level: "m2",
  },
  {
    id: "vocab-022",
    sentence: "She () her friends at the cafe.",
    answers: ["meets"],
    translation: "그녀는 카페에서 친구들을 만난다.",
    level: "m2",
  },
  {
    id: "vocab-023",
    sentence: "We () to the park on sunny days.",
    answers: ["go"],
    translation: "우리는 맑은 날 공원에 간다.",
    level: "m2",
  },
  {
    id: "vocab-024",
    sentence: "He () his favorite book.",
    answers: ["reads"],
    translation: "그는 좋아하는 책을 읽는다.",
    level: "m2",
  },
  {
    id: "vocab-025",
    sentence: "They () basketball after school.",
    answers: ["play"],
    translation: "그들은 방과 후 농구를 한다.",
    level: "m2",
  },
  {
    id: "vocab-026",
    sentence: "I () my homework before dinner.",
    answers: ["do"],
    translation: "나는 저녁 전에 숙제를 한다.",
    level: "m2",
  },
  {
    id: "vocab-027",
    sentence: "She () her room on Saturdays.",
    answers: ["cleans"],
    translation: "그녀는 토요일에 방을 청소한다.",
    level: "m2",
  },
  {
    id: "vocab-028",
    sentence: "We () English songs together.",
    answers: ["sing"],
    translation: "우리는 함께 영어 노래를 부른다.",
    level: "m2",
  },
  {
    id: "vocab-029",
    sentence: "He () his bike to the park.",
    answers: ["rides"],
    translation: "그는 공원까지 자전거를 탄다.",
    level: "m2",
  },
  {
    id: "vocab-030",
    sentence: "They () TV in the living room.",
    answers: ["watch"],
    level: "m2",
    // translation 없음 (해석 준비중 테스트용)
  },
];
export type KeypadProblem = {
  id?: string;
  mode?: "keypad";
  sentence: string;
  answers: string[];
  options: string[];
  explanation?: string;
  body?: string | null;
};

// ✅ DB에서 가져오고 실패하면 기존 배열로 폴백
export async function loadVocabGameProblems(params?: {
  grade?: string | number;
  subject?: string;
  limit?: number;
}): Promise<KeypadProblem[]> {
  const grade = String(params?.grade ?? "2");
  const subject = String(params?.subject ?? "english");
  const limit = params?.limit ?? 10;

  const res = await fetch("/api/vocab-game", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ grade, subject, limit }),
  });

  const json = await res.json().catch(() => null);

  if (res.ok && json?.ok && Array.isArray(json.problems) && json.problems.length) {
    return json.problems as KeypadProblem[];
  }

  // ⚠️ 여기서 "기존 10문제 배열 변수명"을 반환해야 함
  // 아래 return 한 줄만 너 파일에 맞게 바꿔!
  return (VOCAB_GAME_SAMPLE as any) as KeypadProblem[];

}