import { useCallback, useEffect, useMemo, useRef, useState } from "react";

export interface UseAlphaKeypadGameProps {
  sentence: string; // "()" 포함
  answers: string[]; // 빈칸 수와 동일
  onComplete?: (result: {
    correct: boolean;
    points: number;
    usedHint: boolean;
    usedReveal: boolean;
  }) => void;
}

/** a-z만 남김 */
function norm(s: string) {
  return (s ?? "").toLowerCase().replace(/[^a-z]/g, "");
}

export function useAlphaKeypadGame({
  sentence,
  answers,
  onComplete,
}: UseAlphaKeypadGameProps) {
  const blankCount = useMemo(
    () => (sentence.match(/\(\)/g) || []).length,
    [sentence]
  );
  const normAnswers = useMemo(() => answers.map((a) => norm(a)), [answers]);

  const isValid = blankCount === answers.length;
  const error = isValid
    ? null
    : `문장 빈칸(()) 개수(${blankCount})와 answers 개수(${answers.length})가 다릅니다.`;

  const [activeBlankIndex, setActiveBlankIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<string[]>(() =>
    Array(blankCount).fill("")
  );
  const [revealed, setRevealed] = useState<boolean[]>(() =>
    Array(blankCount).fill(false)
  );

  // ✅ UI 표시용 state
  const [usedHint, setUsedHint] = useState(false);
  const [usedReveal, setUsedReveal] = useState(false);

  // ✅ 점수 계산 “즉시 반영”용 ref (state 지연 문제 해결)
  const usedHintRef = useRef(false);
  const usedRevealRef = useRef(false);

  const [isComplete, setIsComplete] = useState(false);

  // 문제 바뀌면 리셋
  useEffect(() => {
    setActiveBlankIndex(0);
    setUserAnswers(Array(blankCount).fill(""));
    setRevealed(Array(blankCount).fill(false));
    setUsedHint(false);
    setUsedReveal(false);
    usedHintRef.current = false;
    usedRevealRef.current = false;
    setIsComplete(false);
  }, [sentence, blankCount]);

  // ✅ 현재 활성 빈칸의 정답 글자만 키패드 표시 (안정 정렬)
  const letters = useMemo(() => {
    const target = normAnswers[activeBlankIndex] ?? "";
    const set = new Set<string>();
    target.split("").forEach((c) => c && set.add(c));
    return Array.from(set).sort();
  }, [normAnswers, activeBlankIndex]);

  const checkAllCorrect = useCallback(
    (ua: string[]) => ua.every((v, i) => norm(v) === normAnswers[i]),
    [normAnswers]
  );

  const finalizeIfDone = useCallback(
    (ua: string[]) => {
      const done = ua.every(
        (v, i) => norm(v).length === (normAnswers[i]?.length ?? 0)
      );
      if (!done) return;

      const correct = checkAllCorrect(ua);

      // ✅ 점수 규칙 (요청 반영)
      // - 정답 기본: +2
      // - 힌트 사용: -1
      // - 정답보기 사용: -2
      // - 오답이면 기본 0에서 패널티만 적용 → 음수 가능
      const base = correct ? 2 : 0;
      const points =
        base - (usedHintRef.current ? 1 : 0) - (usedRevealRef.current ? 2 : 0);

      setIsComplete(true);
      onComplete?.({
        correct,
        points,
        usedHint: usedHintRef.current,
        usedReveal: usedRevealRef.current,
      });
    },
    [checkAllCorrect, normAnswers, onComplete]
  );

  const onKeyPress = useCallback(
    (letter: string) => {
      if (!isValid || isComplete) return;
      const l = norm(letter);
      if (!l) return;

      const target = normAnswers[activeBlankIndex] ?? "";
      const cur = userAnswers[activeBlankIndex] ?? "";
      if (cur.length >= target.length) return;

      const next = [...userAnswers];
      next[activeBlankIndex] = (cur + l).slice(0, target.length);
      setUserAnswers(next);

      // 채우면 다음 빈칸으로 이동
      if (next[activeBlankIndex].length === target.length) {
        const ni = activeBlankIndex + 1;
        if (ni < blankCount) setActiveBlankIndex(ni);
        finalizeIfDone(next);
      }
    },
    [
      isValid,
      isComplete,
      normAnswers,
      activeBlankIndex,
      userAnswers,
      blankCount,
      finalizeIfDone,
    ]
  );

  const onBackspace = useCallback(() => {
    if (!isValid || isComplete) return;
    const cur = userAnswers[activeBlankIndex] ?? "";
    if (!cur) return;

    const next = [...userAnswers];
    next[activeBlankIndex] = cur.slice(0, -1);
    setUserAnswers(next);
  }, [isValid, isComplete, userAnswers, activeBlankIndex]);

  // 힌트: 현재 빈칸에 다음 글자 1개 채움 (1회만)
  const onHint = useCallback(() => {
    if (!isValid || isComplete) return;

    const target = normAnswers[activeBlankIndex] ?? "";
    const cur = userAnswers[activeBlankIndex] ?? "";
    if (cur.length >= target.length) return;

    if (!usedHintRef.current) {
      usedHintRef.current = true;
      setUsedHint(true);
    }

    const next = [...userAnswers];
    next[activeBlankIndex] = target.slice(0, cur.length + 1);
    setUserAnswers(next);

    if (next[activeBlankIndex].length === target.length) {
      const ni = activeBlankIndex + 1;
      if (ni < blankCount) setActiveBlankIndex(ni);
      finalizeIfDone(next);
    }
  }, [
    isValid,
    isComplete,
    normAnswers,
    activeBlankIndex,
    userAnswers,
    blankCount,
    finalizeIfDone,
  ]);

  // 정답 보기: 현재 빈칸을 정답으로 채우고 revealed 표시 (1회만)
  const onReveal = useCallback(() => {
    if (!isValid || isComplete) return;

    if (!usedRevealRef.current) {
      usedRevealRef.current = true;
      setUsedReveal(true);
    }

    const nextR = [...revealed];
    nextR[activeBlankIndex] = true;
    setRevealed(nextR);

    const next = [...userAnswers];
    next[activeBlankIndex] = normAnswers[activeBlankIndex] ?? "";
    setUserAnswers(next);

    const ni = activeBlankIndex + 1;
    if (ni < blankCount) setActiveBlankIndex(ni);
    finalizeIfDone(next);
  }, [
    isValid,
    isComplete,
    revealed,
    activeBlankIndex,
    userAnswers,
    normAnswers,
    blankCount,
    finalizeIfDone,
  ]);

  return {
    isValid,
    error,

    letters,
    onKeyPress,
    onBackspace,
    onHint,
    onReveal,

    activeBlankIndex,
    setActiveBlankIndex,
    userAnswers,
    revealed,

    isComplete,
    usedHint,
    usedReveal,
  };
}
