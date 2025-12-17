export function extractProblemText(raw: unknown): string {
  if (!raw) return "";

  // content가 문자열(JSON 문자열 포함)로 오는 경우 방어
  let content: any = raw;
  if (typeof content === "string") {
    const s = content.trim();
    if (!s) return "";
    try {
      content = JSON.parse(s);
    } catch {
      // 그냥 일반 문자열이면 그대로 사용
      return s;
    }
  }

  // 다양한 스키마 키 후보들(문법/어휘/대화/본문 혼합 대응)
  const candidates = [
    content.problem,
    content.question,
    content.questionText,
    content.text,
    content.stem,
    content.prompt,
    content.sentence,
    content.sentenceText,
    content.passage,      // 본문형
    content.dialogue,     // 대화문형
    content.body,
  ];

  for (const c of candidates) {
    if (typeof c === "string" && c.trim()) return c.trim();
  }

  // content 안에 또 nested가 있는 경우도 방어
  const nestedCandidates = [
    content?.data?.question,
    content?.data?.text,
    content?.payload?.question,
    content?.payload?.text,
  ];
  for (const c of nestedCandidates) {
    if (typeof c === "string" && c.trim()) return c.trim();
  }

  return "";
}

