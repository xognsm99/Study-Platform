// src/components/ProblemRenderer.tsx
"use client";

import { normalizeQtype } from "@/lib/teacher/normalize";

type AnyProblem = {
  id?: string;

  // 실사용 필드들
  qtype?: string;
  text?: string;
  passage?: string;

  answer?: any;
  answer_no?: number | null;

  // content 안
  content?: {
    qtype?: string;
    raw?: any;
    passage?: string;
  };

  // 혹시 flat하게 들어오는 케이스 대비
  raw?: any;
};

interface ProblemRendererProps {
  problem: AnyProblem;
  number: number;
  showAnswer?: boolean;
}

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

function getPrintText(item: AnyProblem) {
  const raw = getRaw(item);
  // ✅ 네 DB 구조: raw.문제
  return pickFirst(raw?.문제, raw?.question, raw?.stem, raw?.text, item?.text);
}

function getPrintPassage(item: AnyProblem) {
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

function getPrintChoices(item: AnyProblem): string[] {
  const raw = getRaw(item);

  // ✅ 핵심: raw.보기1~5
  const arr = [
    raw?.보기1,
    raw?.보기2,
    raw?.보기3,
    raw?.보기4,
    raw?.보기5,
  ]
    .map((x) => String(x ?? "").trim())
    .filter(Boolean);

  if (arr.length >= 2) return arr;

  // 혹시 다른 형태(배열/객체)도 커버
  const v = raw?.choices ?? raw?.options ?? raw?.보기;
  if (Array.isArray(v) && v.length) {
    return v.map((x) => String(x ?? "").trim()).filter(Boolean);
  }
  if (v && typeof v === "object") {
    const keys = Object.keys(v).sort((a, b) => Number(a) - Number(b));
    const out = keys.map((k) => String(v[k] ?? "").trim()).filter(Boolean);
    if (out.length >= 2) return out;
  }

  return [];
}

function getPrintExplanation(item: AnyProblem) {
  const raw = getRaw(item);
  // 해설/해석
  return pickFirst(raw?.해설, raw?.explanation, raw?.해석, raw?.solution);
}

function getPrintAnswer(item: AnyProblem) {
  const raw = getRaw(item);

  // 1) 숫자 정답(1~5) 형태
  const n =
    raw?.정답번호 ??
    raw?.정답 ??
    raw?.answer ??
    raw?.correct ??
    item?.answer ??
    item?.answer_no;

  if (typeof n === "number" && Number.isFinite(n)) return n;

  const parsed = Number(String(n ?? "").trim());
  if (Number.isFinite(parsed) && parsed > 0) return parsed;

  // 2) 정답이 "A/B/C/D/E" 로 오는 경우 → 1~5로 변환
  const letter = String(
    raw?.정답 ?? raw?.answerLetter ?? raw?.answer ?? ""
  )
    .trim()
    .toUpperCase();
  const map: Record<string, number> = { A: 1, B: 2, C: 3, D: 4, E: 5 };
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

export function ProblemRenderer({
  problem,
  number,
  showAnswer = false,
}: ProblemRendererProps) {
  const raw = getRaw(problem);

  const qtype = normalizeQtype(
    problem?.qtype ?? raw?.qtype ?? problem?.content?.qtype
  );

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
              {choices.map((c, i) => (
                <li key={i}>{c}</li>
              ))}
            </ol>
          )}
        </>
      ) : (
        <>
          {/* 기존: 지문 → 문제 → 보기 */}
          {passage && <div className="print-passage">{passage}</div>}
          <div className="print-question">
            {text || "(문제 문장을 찾지 못했습니다)"}
          </div>
          {choices.length > 0 && (
            <ol className="print-choices">
              {choices.map((c, i) => (
                <li key={i}>{c}</li>
              ))}
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

          {explanation && (
            <div className="print-explain">▶ 해설: {explanation}</div>
          )}
        </div>
      )}
    </div>
  );
}

export default ProblemRenderer;
