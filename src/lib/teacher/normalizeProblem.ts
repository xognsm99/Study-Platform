/**
 * 선생님 전용: 문제 content 구조 정규화
 * 학생 로직을 참조하지 않고 선생님 전용으로 독립적으로 구현
 * 
 * 문제 content 구조가 바뀌어도 인쇄/미리보기가 깨지지 않게 안전하게 처리
 * explanation이 없으면 content.explanation || content.solution || "" 로 처리
 */

export type NormalizedProblem = {
  id: string;
  question: string;
  choices: string[];
  answerIndex: number;
  answer_no: number | null;
  explanation: string;
  passage?: string;
  sentences?: Array<{ label?: number | string; speaker?: string; text: string }>;
  type: "dialogue" | "vocab" | "reading" | "grammar" | "other";
  category: string;
  qtype: string;
  difficulty: string;
  content?: any; // 원본 content 보존
};

type AnyProblem = {
  id?: string;
  // 최상위
  question?: string;
  prompt?: string;
  choices?: any[];
  options?: any[];
  answerIndex?: number;
  answer_no?: number | null;
  correctIndex?: number;
  explanation?: string;
  solution?: string;
  passage?: string;
  sentences?: Array<{ label?: number | string; speaker?: string; text: string }>;
  type?: string;
  category?: string;
  qtype?: string;
  difficulty?: string;
  // content 안에 들어 있을 수도 있음
  content?: {
    question?: string;
    choices?: any[];
    options?: any[];
    answerIndex?: number;
    answer_no?: number | null;
    correctIndex?: number;
    explanation?: string;
    solution?: string;
    passage?: string;
    sentences?: Array<{ label?: number | string; speaker?: string; text: string }>;
    type?: string;
    category?: string;
    qtype?: string;
    raw?: {
      question?: string;
      choices?: any[];
      answer?: number;
      answer_no?: number;
      explanation?: string;
      solution?: string;
      passage?: string;
      qtype?: string;
    };
  };
};

/**
 * 문제를 정규화하여 일관된 구조로 변환
 * content 구조가 바뀌어도 안전하게 처리
 */
export function normalizeProblem(problem: AnyProblem): NormalizedProblem {
  const c = problem.content || {};
  const raw = (c as any)?.raw ?? {};

  // ── ID ─────────────────────────────────────────
  const id = String(problem.id ?? "");

  // ── 질문 문장 (프롬프트) ─────────────────────────────────────
  // 우선순위: 평평한 구조 > content.raw > content.question > content.prompt > prompt
  const question =
    String(
      (problem as any).question ??
      raw.question ??
      c.question ??
      c.prompt ??
      problem.prompt ??
      ""
    ).trim();

  // ── 선택지 ───────────────────────────────────────
  const rawChoices =
    (problem as any).choices ??
    raw.choices ??
    problem.choices ??
    c.choices ??
    problem.options ??
    c.options ??
    [];

  const choices = Array.isArray(rawChoices)
    ? rawChoices.map((ch) => String(ch)).slice(0, 5) // 최대 5개
    : [];

  // ── 정답 인덱스 (0-based) ───────────────────────────────────
  let answerIndex: number = 0;
  // answer_no가 있으면 1-based를 0-based로 변환
  if (typeof (problem as any).answer_no === "number" && (problem as any).answer_no >= 1) {
    answerIndex = (problem as any).answer_no - 1;
  } else if (typeof raw.answer_no === "number" && raw.answer_no >= 1) {
    answerIndex = raw.answer_no - 1;
  } else if (typeof raw.answer === "number" && raw.answer >= 1) {
    answerIndex = raw.answer - 1;
  } else if (typeof problem.answerIndex === "number") {
    answerIndex = problem.answerIndex;
  } else if (typeof c.answerIndex === "number") {
    answerIndex = c.answerIndex;
  } else if (typeof problem.correctIndex === "number") {
    answerIndex = problem.correctIndex;
  } else if (typeof c.correctIndex === "number") {
    answerIndex = c.correctIndex;
  }

  // answer_no (1-based) 보존
  const answer_no =
    (problem as any).answer_no ??
    raw.answer_no ??
    raw.answer ??
    (answerIndex >= 0 ? answerIndex + 1 : null);

  // ── 해설 ─────────────────────────────────────────
  // explanation이 없으면 content.explanation || content.solution || "" 로 안전하게 처리
  const explanation =
    String(
      (problem as any).explanation ??
      raw.explanation ??
      problem.explanation ??
      c.explanation ??
      problem.solution ??
      c.solution ??
      raw.solution ??
      ""
    ).trim() || "해설이 제공되지 않았습니다.";

  // ── 지문/본문 텍스트 ─────────────────────────────
  const passage =
    (problem as any).passage ??
    raw.passage ??
    problem.passage ??
    c.passage ??
    c.text ??          // e.g. { text: "..." }
    c.body ??          // e.g. { body: "..." }
    c.context ??       // e.g. { context: "..." }
    undefined;

  // ── 대화/문장 배열 ───────────────────────────────
  let sentences: NormalizedProblem["sentences"] =
    problem.sentences ??
    c.sentences ??
    undefined;

  // content.dialogue / content.lines / content.dialog / content.turns 같이
  // 다른 키에 들어 있을 수도 있으니 전부 한 번 훑어 본다.
  const dialogueLike: any =
    c.dialogue ??
    c.lines ??
    c.dialog ??
    c.turns ??
    undefined;

  if (!sentences && Array.isArray(dialogueLike)) {
    sentences = dialogueLike.map((line: any, idx: number) => {
      if (typeof line === "string") {
        return {
          label: idx + 1,
          text: line,
        };
      }
      // 객체 형태일 때 여러 케이스 커버
      return {
        label: line.label ?? line.no ?? line.idx ?? idx + 1,
        speaker: line.speaker ?? line.name ?? line.who ?? undefined,
        text:
          line.text ??
          line.sentence ??
          line.content ??
          String(line),
      };
    });
  }

  // dialogue 필드도 sentences로 변환 (dialogue_blank 타입용)
  if (!sentences && Array.isArray(c.dialogue)) {
    sentences = c.dialogue.map((line: any, idx: number) => ({
      label: idx + 1,
      speaker: line.speaker,
      text: line.text || String(line),
    }));
  }

  // ── 타입 정규화 (대화/어휘/독해/문법) ───────────────────
  const typeRaw =
    (problem.type ??
      problem.category ??
      c.type ??
      c.category ??
      ""
    ).toLowerCase();

  let type: NormalizedProblem["type"] = "other";
  if (typeRaw.includes("dialog")) type = "dialogue";
  else if (typeRaw.includes("대화")) type = "dialogue";
  else if (typeRaw.includes("vocab") || typeRaw.includes("어휘")) type = "vocab";
  else if (typeRaw.includes("grammar") || typeRaw.includes("문법")) type = "grammar";
  else if (typeRaw.includes("reading") || typeRaw.includes("독해") || typeRaw.includes("본문")) {
    type = "reading";
  }

  // ── category ─────────────────────────────────────
  const category = String(problem.category ?? c.category ?? type ?? "");

  // ── qtype ───────────────────────────────────────
  const qtype = String(
    problem.qtype ??
    c.qtype ??
    raw.qtype ??
    ""
  );

  // ── difficulty ──────────────────────────────────
  const difficulty = String(problem.difficulty ?? c.difficulty ?? "1");

  return {
    id,
    question,
    choices,
    answerIndex,
    answer_no,
    explanation,
    passage,
    sentences,
    type,
    category,
    qtype,
    difficulty,
    content: problem.content, // 원본 content 보존
  };
}

