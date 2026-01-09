/**
 * Quiz 컴포넌트에서 공통으로 사용하는 유틸 함수들
 */

import React from "react";
import { DEFAULT_QUIZ_SIZE, getCategoryLabel, normalizeCategory } from "@/lib/utils/constants";
import { isPlaceholderQuestion, isValidProblem, type ExamMeta } from "@/lib/utils/exam";
import type { ProblemItem } from "./QuizClient";

export function subjectLabel(subject: string): string {
  if (subject === "english") return "영어";
  if (subject === "math") return "수학";
  return subject;
}

export function categoryLabel(category: string): string {
  return getCategoryLabel(category);
}

export function difficultyBadge(d?: string): string {
  const v = String(d ?? "").toLowerCase();
  if (!v) return "";
  if (v === "easy") return "난이도: 하";
  if (v === "medium") return "난이도: 중";
  if (v === "hard") return "난이도: 상";
  return `난이도: ${v}`;
}

/**
 * 지문+빈칸 렌더 유틸
 * (A) (B) 같은 빈칸 토큰을 밑줄 박스로 치환
 */
export function renderWithBlanks(text?: string) {
  if (!text) return null;

  // (A) (B) 같은 빈칸 토큰을 밑줄 박스로 치환
  const re = /\(([A-Z])\)/g;
  const nodes: React.ReactNode[] = [];

  let last = 0;
  let m: RegExpExecArray | null;

  while ((m = re.exec(text)) !== null) {
    const start = m.index;
    if (start > last) nodes.push(text.slice(last, start));

    const label = m[1];
    nodes.push(
      <span
        key={`blank-${label}-${start}`}
        className="inline-block align-middle mx-1 min-w-[120px] h-6 border-b-2 border-gray-500"
        aria-label={`빈칸 ${label}`}
      />
    );

    last = start + m[0].length;
  }

  if (last < text.length) nodes.push(text.slice(last));
  return nodes.length > 0 ? <>{nodes}</> : text;
}

/**
 * 문제 텍스트 추출 유틸 (선생님 미리보기/인쇄용)
 * 우선순위:
 *  - content.question
 *  - content.prompt
 *  - content.stem
 *  - content.sentence
 *  - content.text
 *  - content.passage + content.question
 *  - content.dialogue + content.question
 *  - 그래도 없으면 null
 */
export function getProblemText(problem: any): string | null {
  const content = problem?.content ?? {};
  const q = (v: any) => (typeof v === "string" ? v.trim() : "");

  const direct =
    q(content.question) ||
    q(content.prompt) ||
    q(content.stem) ||
    q(content.sentence) ||
    q(content.text);

  if (direct) return direct;

  const fromPassage =
    q(content.passage) && q(content.question)
      ? `${q(content.passage)}\n${q(content.question)}`
      : "";

  if (fromPassage) return fromPassage;

  const fromDialogue =
    q(content.dialogue) && q(content.question)
      ? `${q(content.dialogue)}\n${q(content.question)}`
      : "";

  if (fromDialogue) return fromDialogue;

  return null;
}

export function formatDialogue(text: string): string {
  return text
    .replace(/\s*(A:)/g, "\n$1")
    .replace(/\s*(B:)/g, "\n$1")
    .trim();
}

export function generateHint(problem: ProblemItem, category: string): string {
  // 1) qtype 및 텍스트 추출
  const c: any = (problem as any)?.content ?? {};
  const qtype = String(c?.qtype ?? c?.raw?.qtype ?? (problem as any)?.qtype ?? "").trim().toLowerCase();

  const questionText = String((problem as any)?.question ?? c?.question ?? c?.raw?.문제 ?? c?.raw?.question ?? "").trim();
  const passageText = String(c?.stimulus ?? c?.raw?.지문 ?? c?.passage ?? "").trim();
  const combined = `${questionText}\n${passageText}`.toLowerCase();

  // 2) 부정형 문제 감지 (NOT/아닌 것/틀린 것)
  const negativePatterns = [
    "적절하지", "옳지", "틀린", "어색한", "부적절",
    "not correct", "incorrect", "not appropriate", "which is not", "least appropriate"
  ];
  const isNegative = negativePatterns.some(pattern => combined.includes(pattern));

  if (isNegative) {
    // 부정형 문제는 절대 특정 선택지를 암시하지 않는 안전 힌트만 제공
    const safeHints = [
      "이 문제는 '맞는 것'이 아니라 문맥에 가장 어색한 것을 고르는 유형입니다.",
      "보기를 하나씩 넣어 읽어보고 의미/문법/연결이 깨지는 지점을 찾으세요.",
      "품사·시제·수일치·의미 연결(앞뒤 문장) 중 하나가 어긋나는 보기가 정답입니다."
    ];
    // 문제 ID 기반 결정적 선택 (랜덤처럼 보이지만 같은 문제는 항상 같은 힌트)
    const idx = Math.abs((problem.id?.charCodeAt(0) ?? 0) % safeHints.length);
    return safeHints[idx];
  }

  // 3) qtype 기반 힌트 (긍정형 문제만)
  const qtypeHints: Record<string, string> = {
    "어휘_사전": "뜻을 그대로 외우기보다, 문장 속 뉘앙스(긍/부정, 강도)를 먼저 확인하세요.",
    "어휘_영영": "영영 정의에서 핵심동사/대상(무엇을/왜/어떻게)을 잡고 보기 의미와 매칭하세요.",
    "어휘_문맥": "빈칸 앞뒤 연결어(so/but/because)로 방향(원인/대조/결론)을 먼저 잡으세요.",
    "문법_어법오류": "동사 형태(시제/수동)→수일치→전치사/접속사 순으로 빠르게 점검하세요.",
    "문법_빈칸": "시제·수일치·대명사 지시 대상부터 확인하면 정답이 빨리 좁혀집니다.",
    "문법_배열": "대명사/지시어(this/that/it)와 접속사로 문장 연결 고리를 먼저 잡으세요.",
    "본문_제목": "반복되는 키워드 2~3개가 주제입니다. 가장 '포괄적인' 제목을 고르세요.",
    "본문_물음": "문제가 묻는 대상(누가/무엇/왜)을 표시하고 그 근처 문장을 먼저 찾으세요.",
    "본문_일치": "선택지와 본문을 단어 그대로가 아니라 동의어/바꿔말하기로 비교하세요.",
    "대화문_빈칸": "직전 발화의 감정(걱정/기쁨/요청)에 맞는 톤(격려/공감/응답)인지 보세요.",
    "대화문_흐름": "대화 목적(부탁/제안/사과/축하)이 자연스럽게 이어지는지 확인하세요.",
    "대화문_응답": "질문이면 답(Yes/No/정보), 부탁이면 수락/거절 구조가 맞아야 합니다."
  };

  // qtype 정확 매칭 시도
  if (qtype && qtypeHints[qtype]) {
    return qtypeHints[qtype];
  }

  // qtype 부분 매칭 시도
  for (const [key, hint] of Object.entries(qtypeHints)) {
    if (qtype.includes(key) || key.includes(qtype)) {
      return hint;
    }
  }

  // 4) qtype 없을 때 category 기반 fallback
  const normalizedCat = normalizeCategory(category);

  if (normalizedCat === "vocab") {
    return "단어 뜻만 보지 말고 문장 속 뉘앙스와 연결을 함께 보세요.";
  }

  if (normalizedCat === "grammar") {
    return "시제·수일치·품사부터 체크하면 빠릅니다.";
  }

  if (normalizedCat === "body") {
    return "핵심 주제/근거 문장을 먼저 찾으세요.";
  }

  if (normalizedCat === "dialogue") {
    return "직전 발화의 의도(요청/걱정/사과)에 맞는 응답을 고르세요.";
  }

  // 5) 기본 힌트
  return "문제를 다시 읽어보고, 문맥과 함께 생각해 보세요.";
}

// 카테고리 타입 정의
type Cat = "vocab" | "grammar" | "reading" | "dialogue";

// 카테고리 정규화 함수
function normalizeCat(v: string): Cat | null {
  const x = (v ?? "").trim().toLowerCase();
  if (x === "vocabulary" || x === "어휘") return "vocab";
  if (x === "body" || x === "본문") return "reading";
  if (x === "dialog" || x === "대화문") return "dialogue";
  if (x === "vocab" || x === "grammar" || x === "reading" || x === "dialogue") return x as Cat;
  return null;
}

// 카테고리 배열 정규화 함수
function normalizeCats(input?: string[] | string): Cat[] {
  const arr = Array.isArray(input) ? input : (input ? [input] : []);
  return arr.map(normalizeCat).filter(Boolean) as Cat[];
}

// ✅ grade 정규화 함수 (학생 전용)
// "중2", "중 2", "2학년", 2 등 → "2" 로 통일
export function normalizeGrade(input: any): string {
  const s = String(input ?? "").trim();
  const digits = s.replace(/[^\d]/g, "");
  return digits.length > 0 ? digits : s;
}

// ✅ 학생용 문제 fetch (student/random만 사용)
export async function fetchProblemsFromAPI(params: {
  grade: string;
  subject: string;
  categories?: string[]; // 권장
  category?: string;     // 하위호환
}): Promise<{ problems: ProblemItem[]; error: string | null }> {
  // ✅ grade 정규화 (중2 → 2)
  const gradeNorm = normalizeGrade(params.grade);
  
  const subjectMap: Record<string, string> = {
    "영어": "english",
    "수학": "math",
    "국어": "korean",
    "과학": "science",
  };
  let normalizedSubject = params.subject;
  if (typeof params.subject === "string" && subjectMap[params.subject]) {
    normalizedSubject = subjectMap[params.subject];
  }

  // ✅ categories 정규화 (category 단일값도 처리)
  const normalizedCategories = normalizeCats(params.categories?.length ? params.categories : params.category);

  // ❌ throw 금지 (런타임 크래시 원인) - 에러 반환으로 변경
  if (normalizedCategories.length === 0) {
    return { problems: [], error: "유형을 선택해 주세요." };
  }

  if (process.env.NODE_ENV === "development") {
    console.log("[fetchProblemsFromAPI] 파라미터 디버그", {
      grade: gradeNorm,
      subject: normalizedSubject,
      categories: normalizedCategories,
    });
  }

  // ✅ 학생 모드: 무조건 /api/student/random만 호출 (쿼리스트링으로 전달, GET)
  const searchParams = new URLSearchParams();
  searchParams.set("grade", gradeNorm);
  searchParams.set("subject", String(normalizedSubject));
  searchParams.set("categories", normalizedCategories.join(",")); // CSV, JSON.stringify 금지

  const endpoint = `/api/student/random?${searchParams.toString()}`;
  
  const res = await fetch(endpoint, { method: "GET", cache: "no-store" });

  // ✅ 항상 text로 먼저 읽고 JSON 파싱 시도 (Unexpected end 방지)
  const text = await res.text().catch(() => "");
  let json: any = null;
  if (text) {
    try {
      json = JSON.parse(text);
    } catch {
      const msg = `student/random 응답이 JSON이 아님: ${res.status} ${text.slice(0, 200)}`;
      if (process.env.NODE_ENV === "development") {
        console.error(msg);
      }
      return { problems: [], error: "문제를 불러오지 못했습니다." };
    }
  } else {
    json = {};
  }

  // HTTP 에러면 서버가 준 에러 메시지 활용
  if (!res.ok) {
    const errMsg = json?.error || json?.message || text || `HTTP ${res.status}`;
    if (process.env.NODE_ENV === "development") {
      console.error("student/random 실패:", errMsg);
    }

    // 403 구독 필요 에러 처리 (needsSubscription 플래그 확인)
    if (res.status === 403 && json?.needsSubscription) {
      const reason = json.reason || "quiz";
      // 에러 객체에 특수 플래그 포함하여 호출측에서 리다이렉트 처리
      return {
        problems: [],
        error: `SUBSCRIPTION_REQUIRED:${reason}`
      };
    }

    return { problems: [], error: "문제를 불러오지 못했습니다." };
  }

  // 문제 데이터 안전성 검증 및 정규화 (5지선다 표준화)
  const normalizedProblems = (json.problems ?? [])
    .map((p: any) => {
      const raw = getRaw(p);
      
      // ✅ choices 후보: raw.보기1~5, raw.choice1~5, raw.options[]
      let choices: string[] = [];
      
      // 1) 이미 choices 배열이 있고 5개면 사용
      if (Array.isArray(p.choices) && p.choices.length === 5) {
        choices = p.choices.map((c: any) => String(c).trim());
      }
      // 2) raw.options 배열이 있고 5개면 사용
      else if (Array.isArray(raw.options) && raw.options.length === 5) {
        choices = raw.options.map((c: any) => String(c).trim());
      }
      // 3) 보기1~5 또는 choice1~5에서 읽기
      else {
        choices = [
          String(raw["보기1"] ?? raw.보기1 ?? raw.choice1 ?? raw["choice1"] ?? "").trim(),
          String(raw["보기2"] ?? raw.보기2 ?? raw.choice2 ?? raw["choice2"] ?? "").trim(),
          String(raw["보기3"] ?? raw.보기3 ?? raw.choice3 ?? raw["choice3"] ?? "").trim(),
          String(raw["보기4"] ?? raw.보기4 ?? raw.choice4 ?? raw["choice4"] ?? "").trim(),
          String(raw["보기5"] ?? raw.보기5 ?? raw.choice5 ?? raw["choice5"] ?? "").trim(),
        ];
      }

      // ✅ 더미 선택지 차단
      const hasPlaceholder = choices.some((c: string) => /^선택지\s*\d+$/i.test(c));
      if (hasPlaceholder && choices.every((c: string) => /^선택지\s*\d+$/i.test(c))) {
        return null;
      }
      
      // ✅ 보기1~5 모두 non-empty 검증 (5지선다 필수)
      if (choices.length !== 5 || choices.some((c: string) => !c || c.length === 0)) {
        return null; // 보기 누락 또는 5개 아님
      }
      
      const question = String(p.question ?? raw.question ?? raw["문제"] ?? "").trim();
      if (!question || question.length < 5) {
        return null;
      }
      
      // ✅ answer 후보: raw.answerNumber, raw.정답번호 (문자열도 숫자로 변환)
      let answerNo: number | null = null;
      
      // 숫자 타입 체크
      if (typeof raw["정답번호"] === "number") answerNo = raw["정답번호"];
      else if (typeof raw.정답번호 === "number") answerNo = raw.정답번호;
      else if (typeof raw.answerNumber === "number") answerNo = raw.answerNumber;
      else if (typeof raw.answer_no === "number") answerNo = raw.answer_no;
      else if (typeof raw.answer === "number") answerNo = raw.answer;
      else if (typeof p.answerIndex === "number") answerNo = p.answerIndex + 1; // 0~4를 1~5로 변환
      // 문자열 타입 체크 및 변환
      else if (typeof raw["정답번호"] === "string") {
        const parsed = parseInt(raw["정답번호"], 10);
        if (!isNaN(parsed)) answerNo = parsed;
      }
      else if (typeof raw.정답번호 === "string") {
        const parsed = parseInt(raw.정답번호, 10);
        if (!isNaN(parsed)) answerNo = parsed;
      }
      else if (typeof raw.answerNumber === "string") {
        const parsed = parseInt(raw.answerNumber, 10);
        if (!isNaN(parsed)) answerNo = parsed;
      }

      if (!answerNo || answerNo < 1 || answerNo > 5) {
        return null; // 정답번호 유효하지 않음
      }

      const answerIndex = answerNo - 1; // 1~5를 0~4로 변환
      
      return {
        id: p.id ?? `problem-${Date.now()}`,
        question,
        choices,
        answerIndex,
        explanation: String(p.explanation ?? "").trim() || "해설이 제공되지 않았습니다.",
        difficulty: p.difficulty,
        frequent: Boolean(p.frequent ?? false),
        explanationWrong: p.explanationWrong ? String(p.explanationWrong).trim() : undefined,
        type: p.type,
        passage: p.passage ? String(p.passage).trim() : undefined,
        content: p.content,
        isPracticeMode: p.isPracticeMode ?? false, // ✅ 연습용 플래그 전달
      };
    })
    .filter((p: any) => p !== null && isValidProblem(p)) as ProblemItem[];

  return { problems: normalizedProblems, error: null };
}

export function loadExamMeta(grade: string, subject: string, category: string): ExamMeta {
  try {
    const stored = localStorage.getItem("examMeta");
    if (stored) {
      const parsed = JSON.parse(stored);
      return {
        ...parsed,
        grade: parsed.grade || grade,
        subject: parsed.subject || subject,
        category: parsed.category || category,
      };
    }
  } catch {
    // 무시
  }
  
  // 기본값 설정
  const now = new Date();
  return {
    grade,
    subject,
    category,
    year: now.getFullYear(),
    semester: now.getMonth() < 6 ? 1 : 2,
    termLabel: category === "final" ? "기말고사" : "중간고사",
  };
}

export function hasValidProblems(problems: ProblemItem[]): boolean {
  return problems.length > 0 && problems.every((p) => isValidProblem(p) && !isPlaceholderQuestion(p));
}

/**
 * 문제의 raw 데이터 추출 헬퍼
 * DB row 그대로 오면 content.raw, 이미 정규화된 객체면 problem.raw / problem.content / problem 자체일 수도 있어서 전부 대응
 */
export function getRaw(problem: any) {
  // DB row 그대로 오면 content.raw
  // 이미 정규화된 객체면 problem.raw / problem.content / problem 자체일 수도 있어서 전부 대응
  return (
    problem?.content?.raw ??
    problem?.content?.raw_content ??
    problem?.raw ??
    problem?.content ??
    problem ??
    {}
  );
}

/**
 * 문제/지문 텍스트 추출 헬퍼
 */
export function pickText(problem: any) {
  const raw = getRaw(problem);

  const c = raw ?? {};

  // ✅ 지문 후보 우선순위 (문장/프롬프트/본문/텍스트/컨텍스트/자극문/정의/대화문)
  const passage =
    (typeof c.sentence === "string" && c.sentence) ||
    (typeof c.prompt === "string" && c.prompt) ||
    (typeof c.passage === "string" && c.passage) ||
    (typeof c.text === "string" && c.text) ||
    (typeof c.context === "string" && c.context) ||
    (typeof c.stimulus === "string" && c.stimulus) ||
    (typeof c.definition === "string" && c.definition) ||
    (typeof c.dialogue === "string" && c.dialogue) ||
    // 기존 필드들도 함께 고려 (지문/본문/kr_passage 등)
    (typeof c["지문"] === "string" && c["지문"]) ||
    (typeof c["본문"] === "string" && c["본문"]) ||
    (typeof c.kr_passage === "string" && c.kr_passage) ||
    (typeof c.raw_passage === "string" && c.raw_passage) ||
    "";

  // ✅ 배열 형태 dialogue/passage 지원
  const passage2 =
    passage ||
    (Array.isArray(c.dialogue) ? c.dialogue.join("\n") : "") ||
    (Array.isArray(c.passage) ? c.passage.join("\n") : "") ||
    "";

  const finalPassage = String(passage2 || "").trim();

  // question 후보: raw.question, raw.문제
  const question =
    raw?.question ??
    raw?.["question"] ??
    raw?.["문제"] ??
    raw?.q_kr ??
    raw?.q_en ??
    raw?.["q_kr"] ??
    raw?.["q_en"] ??
    "";

  return {
    raw,
    passage: finalPassage,
    question: String(question ?? "").trim(),
  };
}