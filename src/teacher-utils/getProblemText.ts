export function getProblemText(problem: any): string {
  if (!problem) return "(문제 텍스트 필드 누락)";

  // 1) top-level 후보
  const topCandidates = [problem.question, problem.text];
  for (const v of topCandidates) {
    if (typeof v === "string" && v.trim()) return v.trim();
  }

  // 2) content 파싱
  let content: any = problem.content;
  if (typeof content === "string") {
    try {
      content = JSON.parse(content);
    } catch {
      // JSON 문자열이 아닌 경우 그대로 둠
    }
  }
  if (!content || typeof content !== "object") {
    return "(문제 텍스트 필드 누락)";
  }

  // 3) content 내부 후보들 - 요청한 우선순위: question, prompt, stem, sentence, text
  const candidates = [
    content.question,
    content.prompt,
    content.stem,
    content.sentence,
    content.text,
  ];

  for (const v of candidates) {
    if (typeof v === "string" && v.trim()) return v.trim();
  }

  // 4) 아주 예외적으로 question이 object로 들어온 경우
  // 예: { text: "..." }
  const qt = content?.question?.text;
  if (typeof qt === "string" && qt.trim()) return qt.trim();

  return "(문제 텍스트 필드 누락)";
}


