// src/components/ProblemRenderer.tsx

"use client";

import React from "react";
import { normalizeQtype } from "@/lib/teacher/normalize";

function getRaw(item: any) {
  const c = item?.content ?? {};
  return c?.raw ?? c;
}

function pickFirst(...vals: any[]) {
  for (const v of vals) {
    const s = String(v ?? "").trim();
    if (s) return s;
  }
  return "";
}

function getPrintText(item: any) {
  const raw = getRaw(item);
  // ✅ 네 DB 구조: raw.문제
  return pickFirst(
    raw?.문제,
    raw?.question,
    raw?.stem,
    raw?.text,
    item?.text
  );
}

function getPrintPassage(item: any) {
  const raw = getRaw(item);
  // ✅ 네 DB 구조: raw.지문
  return pickFirst(
    raw?.지문,
    raw?.passage,
    raw?.본문,
    raw?.reading,
    raw?.article,
    item?.passage
  );
}

function getPrintChoices(item: any): string[] {
  const raw = getRaw(item);

  // ✅ 핵심: raw.보기1~5
  const arr = [
    raw?.보기1, raw?.보기2, raw?.보기3, raw?.보기4, raw?.보기5,
  ].map((x) => String(x ?? "").trim()).filter(Boolean);

  if (arr.length >= 2) return arr;

  // 혹시 다른 형태(배열/객체)도 커버
  const v = raw?.choices ?? raw?.options ?? raw?.보기;
  if (Array.isArray(v) && v.length) {
    return v.map((x) => String(x ?? "").trim()).filter(Boolean);
  }
  if (v && typeof v === "object") {
    const keys = Object.keys(v).sort((a,b)=>Number(a)-Number(b));
    const out = keys.map(k => String(v[k] ?? "").trim()).filter(Boolean);
    if (out.length >= 2) return out;
  }

  return [];
}

function getPrintExplanation(item: any) {
  const raw = getRaw(item);
  // 해설/해석
  return pickFirst(raw?.해설, raw?.explanation, raw?.해석, raw?.solution);
}


function getPrintAnswer(item: any) {
  const raw = getRaw(item);

  // 1) 숫자 정답(1~5) 형태
  const n =
    raw?.정답번호 ??
    raw?.정답 ??
    raw?.answer ??
    raw?.correct ??
    item?.answer;

  if (typeof n === "number" && Number.isFinite(n)) return n;
  const parsed = Number(String(n ?? "").trim());
  if (Number.isFinite(parsed) && parsed > 0) return parsed;

  // 2) 정답이 "A/B/C/D/E" 로 오는 경우 → 1~5로 변환
  const letter = String(raw?.정답 ?? raw?.answerLetter ?? raw?.answer ?? "").trim().toUpperCase();
  const map: any = { A: 1, B: 2, C: 3, D: 4, E: 5 };
  if (map[letter]) return map[letter];

  // 3) 정답이 보기 텍스트 그대로 오는 경우(문자열) → 보기 배열에서 찾아 번호로 변환
  const ansText = String(raw?.정답텍스트 ?? raw?.answerText ?? "").trim();
  if (ansText) {
    const choices = getPrintChoices(item);
    const idx = choices.findIndex((c) => String(c).trim() === ansText);
    if (idx >= 0) return idx + 1;
  }

  return null;
}

type AnyProblem = {
  id?: string;
  // 최상위
  question?: string;
  prompt?: string;
  choices?: any[];
  options?: any[];
  answerIndex?: number;
  correctIndex?: number;
  explanation?: string;
  solution?: string;
  passage?: string;
  sentences?: { label?: number | string; speaker?: string; text: string }[];
  type?: string;
  category?: string;
  difficulty?: string;
  // content 안에 들어 있을 수도 있음
  content?: {
    question?: string;
    choices?: any[];
    options?: any[];
    answerIndex?: number;
    correctIndex?: number;
    explanation?: string;
    solution?: string;
    passage?: string;
    sentences?: { label?: number | string; speaker?: string; text: string }[];
    type?: string;
    category?: string;
  };
};

interface ProblemRendererProps {
  problem: AnyProblem;
  number: number;
  showAnswer?: boolean;
}

function normalizeProblem(problem: AnyProblem) {
  const c = problem.content || {};
  const raw = (c as any)?.raw ?? {};

  // ── 질문 문장 (프롬프트) ─────────────────────────────────────
  // 우선순위: 평평한 구조 > content.raw > content.question > content.prompt > prompt
  const question =
    (problem as any).question ??
    raw.question ??
    c.question ??
    c.prompt ??
    problem.prompt ??
    "";

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
    ? rawChoices.map((ch) => String(ch))
    : [];

  // ── 정답 인덱스 ───────────────────────────────────
  let answerIndex: number = 0;
  // answer_no가 있으면 1-based를 0-based로 변환
  if (typeof (problem as any).answer_no === "number" && (problem as any).answer_no >= 1) {
    answerIndex = (problem as any).answer_no - 1;
  } else if (typeof raw.answer_no === "number" && raw.answer_no >= 1) {
    answerIndex = raw.answer_no - 1;
  } else if (typeof problem.answerIndex === "number") {
    answerIndex = problem.answerIndex;
  } else if (typeof c.answerIndex === "number") {
    answerIndex = c.answerIndex;
  } else if (typeof problem.correctIndex === "number") {
    answerIndex = problem.correctIndex;
  } else if (typeof c.correctIndex === "number") {
    answerIndex = c.correctIndex;
  }

  // ── 해설 ─────────────────────────────────────────
  const explanation =
    (problem as any).explanation ??
    raw.explanation ??
    problem.explanation ??
    c.explanation ??
    problem.solution ??
    c.solution ??
    "";

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
  let sentences: AnyProblem["sentences"] =
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

  // ── 타입 정규화 (대화/어휘/독해) ───────────────────
  const typeRaw =
    (problem.type ||
      problem.category ||
      c.type ||
      c.category ||
      ""
    ).toLowerCase();

  let type: "dialogue" | "vocab" | "reading" | "other" = "other";
  if (typeRaw.includes("dialog")) type = "dialogue";
  else if (typeRaw.includes("대화")) type = "dialogue";
  else if (typeRaw.includes("vocab") || typeRaw.includes("어휘")) type = "vocab";
  else if (typeRaw.includes("reading") || typeRaw.includes("독해") || typeRaw.includes("본문")) {
    type = "reading";
  }

  return { question, choices, answerIndex, explanation, passage, sentences, type };
}

export function ProblemRenderer({ problem, number, showAnswer = false }: ProblemRendererProps) {
  const raw = getRaw(problem);
  const qtype = normalizeQtype(problem?.qtype ?? raw?.qtype ?? problem?.content?.qtype);
  const isVocabEngEng = qtype === "어휘_영영";
  const isGrammar = qtype.startsWith("문법_");
  const isDialogue = qtype.startsWith("대화문_");
  const shouldQuestionFirst = isVocabEngEng || isGrammar || isDialogue;

  const text = getPrintText(problem);
  const passage = getPrintPassage(problem);
  const choices = getPrintChoices(problem);
  const explanation = getPrintExplanation(problem);
  const ans = getPrintAnswer(problem);
  const isAnswerPrint = showAnswer;

  return (
    <div className="print-problem">
      <div className="print-problem-no">문제 {number}</div>

      {shouldQuestionFirst ? (
        <>
          {/* ✅ 문제 먼저 */}
          <div className="print-question">
            {text || "(문제 문장을 찾지 못했습니다)"}
          </div>

          {/* ✅ 그 다음 지문 */}
          {passage && <div className="print-passage">{passage}</div>}

          {/* 보기 */}
          {choices.length > 0 && (
            <ol className="print-choices">
              {choices.map((c, i) => <li key={i}>{c}</li>)}
            </ol>
          )}
        </>
      ) : (
        <>
          {/* 기존: 지문 → 문제 → 보기 */}
          {passage && <div className="print-passage">{passage}</div>}
          <div className="print-question">{text || "(문제 문장을 찾지 못했습니다)"}</div>
          {choices.length > 0 && (
            <ol className="print-choices">
              {choices.map((c, i) => <li key={i}>{c}</li>)}
            </ol>
          )}
        </>
      )}

      {isAnswerPrint && (
        <div className="print-answerbox">
          <div className="print-answerline">
            <span className="label">정답</span>
            <span className="value">{ans ? `${ans}번` : "—"}</span>
          </div>

          {explanation && <div className="print-explain">▶ 해설: {explanation}</div>}
        </div>
      )}
    </div>
  );
}

export default ProblemRenderer;
