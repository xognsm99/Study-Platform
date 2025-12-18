import { useState, useEffect, useCallback, useMemo } from "react";

export interface GameState {
  activeBlankIndex: number;
  userAnswers: string[];
  score: number;
  isComplete: boolean;
}

export interface UseAlphaKeypadGameProps {
  sentence: string;
  answers: string[];
  onComplete?: () => void;
}

/**
 * 알파벳 키패드 게임 상태 관리 훅
 */
export function useAlphaKeypadGame({
  sentence,
  answers,
  onComplete,
}: UseAlphaKeypadGameProps) {
  // 빈칸 수와 정답 수가 일치하는지 확인
  const blankCount = (sentence.match(/\(\)/g) || []).length;

  if (blankCount !== answers.length) {
    return {
      isValid: false,
      error: "게임 모드 미지원 문제",
    };
  }

  // 정답을 소문자로 normalize
  const normAnswers = useMemo(
    () => answers.map((a) => a.toLowerCase().trim()),
    [answers]
  );

  // 키패드 키 배열 생성 (문제가 바뀔 때마다 1회씩 셔플)
  const availableLetters = useMemo(() => {
    const lettersSet = new Set<string>();
    normAnswers.forEach((answer) => {
      answer.split("").forEach((char) => {
        if (char.match(/[a-z]/)) {
          lettersSet.add(char);
        }
      });
    });
    const letters = Array.from(lettersSet);
    // 셔플 (Fisher-Yates) - 문제당 1회만 셔플
    for (let i = letters.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [letters[i], letters[j]] = [letters[j], letters[i]];
    }
    return letters;
  }, [normAnswers.join("|")]); // normAnswers가 바뀔 때만 재생성

  const [activeBlankIndex, setActiveBlankIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<string[]>(
    Array(normAnswers.length).fill("")
  );
  const [hintPenalty, setHintPenalty] = useState(0); // 힌트 사용 횟수
  const [score, setScore] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [revealed, setRevealed] = useState<boolean[]>(() =>
    Array(blankCount).fill(false)
  );
  const [usedReveal, setUsedReveal] = useState(false);

  // 문제가 바뀌면 reset
  useEffect(() => {
    setActiveBlankIndex(0);
    setUserAnswers(Array(normAnswers.length).fill(""));
    setHintPenalty(0);
    setScore(0);
    setIsComplete(false);
    setRevealed(Array(blankCount).fill(false));
    setUsedReveal(false);
  }, [sentence, normAnswers.join("|"), blankCount]);

  // 완료 체크: 모든 빈칸이 채워졌는지 확인
  useEffect(() => {
    if (isComplete) return;

    const allFilled = userAnswers.every(
      (answer, index) => answer.length === normAnswers[index].length
    );

    if (allFilled) {
      let correctCount = 0;
      userAnswers.forEach((userAnswer, index) => {
        // userAnswer와 normAnswers는 모두 소문자로 normalize되어 있음
        if (userAnswer === normAnswers[index]) {
          correctCount++;
        }
      });
      setIsComplete(true);
      // 최종 점수 = 정답 공개 사용 시 0점, 그 외에는 정답 개수 - 힌트 사용 횟수
      const finalScore = usedReveal ? 0 : Math.max(0, correctCount - hintPenalty);
      setScore(finalScore);
      onComplete?.();
    }
  }, [userAnswers, normAnswers, isComplete, hintPenalty, usedReveal, onComplete]);

  // 키 입력 처리
  const handleKeyPress = useCallback(
    (letter: string) => {
      if (isComplete) return;

      const normalizedLetter = letter.toLowerCase();
      const currentAnswer = userAnswers[activeBlankIndex];
      const targetLength = normAnswers[activeBlankIndex].length;

      if (currentAnswer.length < targetLength) {
        const newAnswers = [...userAnswers];
        newAnswers[activeBlankIndex] = currentAnswer + normalizedLetter;
        setUserAnswers(newAnswers);

        // 정답 길이만큼 채워지면 다음 빈칸으로 이동
        if (newAnswers[activeBlankIndex].length === targetLength) {
          const nextIndex = activeBlankIndex + 1;
          if (nextIndex < normAnswers.length) {
            setActiveBlankIndex(nextIndex);
          }
        }
      }
    },
    [activeBlankIndex, userAnswers, normAnswers, isComplete]
  );

  // Backspace 처리
  const handleBackspace = useCallback(() => {
    if (isComplete) return;

    const currentAnswer = userAnswers[activeBlankIndex];
    if (currentAnswer.length > 0) {
      const newAnswers = [...userAnswers];
      newAnswers[activeBlankIndex] = currentAnswer.slice(0, -1);
      setUserAnswers(newAnswers);
    }
  }, [activeBlankIndex, userAnswers, isComplete]);

  // 빈칸 클릭 처리
  const handleBlankClick = useCallback((index: number) => {
    if (isComplete) return;
    setActiveBlankIndex(index);
  }, [isComplete]);

  // 힌트 (첫 글자 자동 채우기)
  const handleHint = useCallback(() => {
    if (isComplete) return;

    const currentAnswer = userAnswers[activeBlankIndex];
    const targetAnswer = normAnswers[activeBlankIndex];

    if (currentAnswer.length === 0 && targetAnswer.length > 0) {
      const newAnswers = [...userAnswers];
      newAnswers[activeBlankIndex] = targetAnswer[0].toLowerCase();
      setUserAnswers(newAnswers);
      setHintPenalty((prev) => prev + 1); // 힌트 사용 횟수 증가
    }
  }, [activeBlankIndex, userAnswers, normAnswers, isComplete]);

  // 정답 공개
  const revealAnswer = useCallback(() => {
    if (isComplete) return;

    setRevealed((prev) => {
      const next = [...prev];
      next[activeBlankIndex] = true;
      return next;
    });
    // 정답 공개는 "치트"니까 점수 박살내기: 완료 시 score=0 되게 플래그
    setUsedReveal(true);
  }, [activeBlankIndex, isComplete]);

  return {
    isValid: true,
    activeBlankIndex,
    userAnswers,
    score,
    isComplete,
    availableLetters,
    revealed,
    handleKeyPress,
    handleBackspace,
    handleBlankClick,
    handleHint,
    revealAnswer,
  };
}

