/**
 * 선생님 전용 category 정규화 함수
 */
export function normalizeTeacherCategory(category?: string | null): "vocabulary" | "grammar" | "dialogue" | "reading" | string {
  if (!category) return "";
  const c = String(category).toLowerCase();
  if (c.includes("vocab")) return "vocabulary";
  if (c.includes("dialog")) return "dialogue";
  if (c.includes("grammar")) return "grammar";
  if (c.includes("reading")) return "reading";
  return String(category);
}

/**
 * qtype 정규화 함수
 */
export function normalizeQtype(v: any): string {
  const s = String(v ?? "").trim();
  // 혹시 영어/축약이 들어오면 여기서 흡수
  if (s === "vocab_engeng" || s === "어휘영영") return "어휘_영영";
  if (s === "vocab_dict" || s === "어휘사전") return "어휘_사전";
  return s;
}

