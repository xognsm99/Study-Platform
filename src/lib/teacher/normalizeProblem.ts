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
  answerIndex: number; // 0-based
  answer_no: number | null; // 1-based
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
      options?: any[];
      answer?: number; // 1-based
      answer_no?: number; // 1-based
      explanation?: string;
      solution?: string;
      passage?: string;
      qtype?: string;
    };
    // 다른 키로 들어올 수 있는 텍스트들
    text?: string;
    body?: string;
    context?: string;
    // 대화형 키들
    dialogue?: any[];
    lines?: any[];
    dialog?: any[];
    turns?: any[];
  };

  // 어떤 데이터는 최상위 raw로도 들어올 수 있음(안정성)
  raw?: any;
};

/**
 * 문제를 정규화하여 일관된 구조로 변환
 * content 구조가 바뀌어도 안전하게 처리
 */
export function normalizeProblem(problem: AnyProblem): NormalizedProblem {
  const p: any = problem as any;
  const c: any = p?.content ?? p; // content가 있으면 content 우선
  const raw: any = p?.raw ?? c?.raw ?? {}; // ✅ raw는 "한 번만" 선언

  // ── ID ─────────────────────────────────────────
  const id = String(p?.id ?? c?.id ?? "");

  // ── 질문 문장 ─────────────────────────────────────
  const question = String(
    p?.question ??
      raw?.question ??
      c?.question ??
      c?.prompt ??
      p?.prompt ??
      ""
  ).trim();

  // ── 선택지 ───────────────────────────────────────
  const rawChoices =
    p?.choices ??
    raw?.choices ??
    c?.choices ??
    p?.options ??
    raw?.options ??
    c?.options ??
    [];

  const choices = Array.isArray(rawChoices)
    ? rawChoices.map((ch: any) => String(ch)).slice(0, 5)
    : [];

  // ── 정답 인덱스(0-based) ──────────────────────────
  let answerIndex = 0;

  // 1-based 우선 처리
  const oneBased =
    (typeof p?.answer_no === "number" ? p.answer_no : undefined) ??
    (typeof raw?.answer_no === "number" ? raw.answer_no : undefined) ??
    (typeof raw?.answer === "number" ? raw.answer : undefined);

  if (typeof oneBased === "number" && oneBased >= 1) {
    answerIndex = oneBased - 1;
  } else if (typeof p?.answerIndex === "number") {
    answerIndex = p.answerIndex;
  } else if (typeof c?.answerIndex === "number") {
    answerIndex = c.answerIndex;
  } else if (typeof p?.correctIndex === "number") {
    answerIndex = p.correctIndex;
  } else if (typeof c?.correctIndex === "number") {
    answerIndex = c.correctIndex;
  }

  // 선택지 길이 기준으로 클램프(인쇄/미리보기 안정화)
  if (choices.length > 0) {
    answerIndex = Math.max(0, Math.min(answerIndex, choices.length - 1));
  } else {
    answerIndex = 0;
  }

  // answer_no (1-based) 보존
  const answer_no =
    (typeof p?.answer_no === "number" ? p.answer_no : undefined) ??
    (typeof raw?.answer_no === "number" ? raw.answer_no : undefined) ??
    (typeof raw?.answer === "number" ? raw.answer : undefined) ??
    (choices.length > 0 ? answerIndex + 1 : null);

  // ── 해설 ─────────────────────────────────────────
  const explanation =
    String(
      p?.explanation ??
        raw?.explanation ??
        c?.explanation ??
        p?.solution ??
        c?.solution ??
        raw?.solution ??
        ""
    ).trim() || "해설이 제공되지 않았습니다.";

  // ── 지문/본문 ─────────────────────────────────────
  const passage =
    p?.passage ??
    raw?.passage ??
    c?.passage ??
    c?.text ??
    c?.body ??
    c?.context ??
    undefined;

  // ── 대화/문장 배열 ───────────────────────────────
  let sentences: NormalizedProblem["sentences"] =
    p?.sentences ?? c?.sentences ?? undefined;

  const dialogueLike =
    c?.dialogue ?? c?.lines ?? c?.dialog ?? c?.turns ?? undefined;

  if (!sentences && Array.isArray(dialogueLike)) {
    sentences = dialogueLike.map((line: any, idx: number) => {
      if (typeof line === "string") {
        return { label: idx + 1, text: line };
      }
      return {
        label: line?.label ?? line?.no ?? line?.idx ?? idx + 1,
        speaker: line?.speaker ?? line?.name ?? line?.who ?? undefined,
        text: String(line?.text ?? line?.sentence ?? line?.content ?? ""),
      };
    });
  }

  // ── 타입 정규화 ───────────────────────────────────
  const typeRaw = String(
    p?.type ?? p?.category ?? c?.type ?? c?.category ?? ""
  ).toLowerCase();

  let type: NormalizedProblem["type"] = "other";
  if (typeRaw.includes("dialog") || typeRaw.includes("대화")) type = "dialogue";
  else if (typeRaw.includes("vocab") || typeRaw.includes("어휘")) type = "vocab";
  else if (typeRaw.includes("grammar") || typeRaw.includes("문법")) type = "grammar";
  else if (
    typeRaw.includes("reading") ||
    typeRaw.includes("독해") ||
    typeRaw.includes("본문")
  ) {
    type = "reading";
  }

  // ── category / qtype / difficulty ────────────────
  const category = String(p?.category ?? c?.category ?? type ?? "");
  const qtype = String(p?.qtype ?? c?.qtype ?? raw?.qtype ?? "");
  const difficulty = String(p?.difficulty ?? c?.difficulty ?? "1");

  return {
    id,
    question,
    choices,
    answerIndex,
    answer_no: typeof answer_no === "number" ? answer_no : null,
    explanation,
    passage,
    sentences,
    type,
    category,
    qtype,
    difficulty,
    content: p?.content,
  };
}
