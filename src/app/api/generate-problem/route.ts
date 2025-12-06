import { NextResponse } from "next/server";
import OpenAI from "openai";

export const runtime = "nodejs"; // ✅ 중요: Edge 말고 Node에서 OpenAI SDK 사용

// -------------------------
// ✅ 기본 Fallback 문제(최소 안전망)
// -------------------------
const FALLBACK = [
  {
    id: "demo-1",
    question: "다음 중 'book'의 뜻은?",
    choices: ["연필", "책", "의자", "창문"],
    answerIndex: 1,
    explanation: "book = 책",
    difficulty: "easy",
    frequent: true,
  },
  {
    id: "demo-2",
    question: "I ___ a student.",
    choices: ["am", "is", "are", "be"],
    answerIndex: 0,
    explanation: "주어 I → am",
    difficulty: "easy",
    frequent: false,
  },
];

// -------------------------
// ✅ 프롬프트
// -------------------------
function buildPrompt(params: {
  grade: string;
  subject: string;
  category: string;
  count: number;
}) {
  const { grade, subject, category, count } = params;

  return `
너는 한국 중·고등학생 시험 대비 문제 출제자다.

[대상]
- 학년: ${grade}
- 과목: ${subject}
- 카테고리: ${category}

[규칙]
- 객관식 4지선다
- 총 ${count}문항
- answerIndex는 0~3
- 난이도는 easy | medium | hard 중 하나
- explanation은 한국어로 짧고 명확하게
- frequent는 true/false (자주 출제되는 유형이면 true)
- 불필요한 문장/설명 없이 JSON만 출력

[출력 스키마]
{
  "problems": [
    {
      "id": "temp-1",
      "question": "...",
      "choices": ["...","...","...","..."],
      "answerIndex": 0,
      "explanation": "...",
      "difficulty": "easy",
      "frequent": false
    }
  ]
}
`.trim();
}

// -------------------------
// ✅ JSON 텍스트에서 객체만 최대한 추출
// -------------------------
function tryExtractJson(text: string) {
  const first = text.indexOf("{");
  const last = text.lastIndexOf("}");
  if (first === -1 || last === -1 || last <= first) return null;
  const sliced = text.slice(first, last + 1);
  try {
    return JSON.parse(sliced);
  } catch {
    return null;
  }
}

// -------------------------
// ✅ 난이도 보정
// -------------------------
function normalizeDifficulty(value: any) {
  const v = String(value ?? "").toLowerCase();
  if (v === "easy" || v === "medium" || v === "hard") return v;
  if (v.includes("하")) return "easy";
  if (v.includes("중")) return "medium";
  if (v.includes("상")) return "hard";
  return "easy";
}

// -------------------------
// ✅ choices 검증/보정
// -------------------------
function normalizeChoices(arr: any) {
  const list = Array.isArray(arr) ? arr.map((x) => String(x)) : [];
  // 4개 미만이면 fallback로 채워넣기
  while (list.length < 4) list.push("선택지");
  return list.slice(0, 4);
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));

  const grade = String(body.grade ?? "중1");
  const subject = String(body.subject ?? "english");
  const category = String(body.category ?? "midterm");
  const countRaw = Number(body.count ?? 10);
  const count = Number.isFinite(countRaw) ? Math.min(Math.max(countRaw, 1), 20) : 10;

  // ✅ 키 없으면 fallback
  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json({
      problems: FALLBACK.slice(0, count),
      source: "fallback-no-key",
    });
  }

  try {
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const prompt = buildPrompt({ grade, subject, category, count });

    // Responses API (권장 흐름) :contentReference[oaicite:0]{index=0}
    const response = await client.responses.create({
      model: "gpt-5-mini",
      input: prompt,
    });

    const text = response.output_text?.trim() ?? "";

    let parsed: any = null;

    try {
      parsed = JSON.parse(text);
    } catch {
      parsed = tryExtractJson(text);
    }

    if (!parsed?.problems || !Array.isArray(parsed.problems)) {
      throw new Error("Invalid AI JSON shape");
    }

    const problems = parsed.problems.map((p: any, i: number) => ({
      id:
        typeof p?.id === "string" && p.id.length > 0
          ? p.id
          : `ai-${Date.now()}-${i}`,
      question: String(p?.question ?? "").trim(),
      choices: normalizeChoices(p?.choices),
      answerIndex: Math.min(Math.max(Number(p?.answerIndex ?? 0), 0), 3),
      explanation: String(p?.explanation ?? "").trim(),
      difficulty: normalizeDifficulty(p?.difficulty),
      frequent: Boolean(p?.frequent ?? false),
    }));

    // 빈 문제 방지
    const safe = problems.filter((p: any) => p.question && p.choices?.length === 4);

    return NextResponse.json({
      problems: safe.length ? safe : FALLBACK.slice(0, count),
      source: "openai",
    });
  } catch (e) {
    return NextResponse.json({
      problems: FALLBACK.slice(0, count),
      source: "fallback-error",
      error: e instanceof Error ? e.message : "unknown",
    });
  }
}
