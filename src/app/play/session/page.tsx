"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import QuizShell from "@/components/quiz/QuizShell";
import Flash4Quiz from "@/components/quiz/types/Flash4Quiz";
import SpellQuiz from "@/components/quiz/types/SpellQuiz";
import BinaryPassageQuiz from "@/components/quiz/types/BinaryPassageQuiz";
import type { GameSet, QuizItem, GameSessionState } from "@/lib/quiz/schema";

export default function PlaySessionPage() {
  const router = useRouter();
  const [gameSet, setGameSet] = useState<GameSet | null>(null);
  const [sessionState, setSessionState] = useState<GameSessionState>({
    currentIndex: 0,
    answers: [],
    startTime: Date.now(),
    endTime: null,
  });
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackCorrect, setFeedbackCorrect] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [redirectToResult, setRedirectToResult] = useState(false);
  
  // 중복 호출 방지 락
  const advanceLockRef = useRef(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const redirectRef = useRef(false);

  // 게임 세트 로드
  useEffect(() => {
    if (typeof window === "undefined") return;

    const stored = sessionStorage.getItem("currentGameSet");
    const startTime = sessionStorage.getItem("gameSessionStartTime");

    if (!stored || !startTime) {
      router.push("/play");
      return;
    }

    try {
      const parsed = JSON.parse(stored) as GameSet;
      setGameSet(parsed);
      setSessionState({
        currentIndex: 0,
        answers: new Array(parsed.items.length).fill(null),
        startTime: parseInt(startTime, 10),
        endTime: null,
      });
    } catch (e) {
      console.error("Failed to load game set", e);
      router.push("/play");
    }
  }, [router]);

  // 타이머
  useEffect(() => {
    if (!gameSet) return;

    const interval = setInterval(() => {
      setSessionState((prev) => {
        const elapsed = Math.floor((Date.now() - prev.startTime) / 1000);
        setElapsedSeconds(elapsed);
        return prev;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [gameSet]);

  // 타이머 cleanup
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, []);

  // 결과 페이지로 리다이렉트 처리
  useEffect(() => {
    if (redirectToResult && !redirectRef.current) {
      redirectRef.current = true;
      router.replace("/play/result");
    }
  }, [redirectToResult, router]);

  // 배열 범위 방어
  useEffect(() => {
    if (!gameSet) return;
    if (sessionState.currentIndex >= gameSet.items.length) {
      // 범위를 넘어가면 즉시 결과로 이동
      const endTime = Date.now();
      const result = {
        answers: sessionState.answers,
        startTime: sessionState.startTime,
        endTime,
        timeSpentSec: Math.floor((endTime - sessionState.startTime) / 1000),
      };
      sessionStorage.setItem("gameResult", JSON.stringify(result));
      setRedirectToResult(true);
    }
  }, [sessionState.currentIndex, gameSet, sessionState]);

  // 답변 처리
  const handleAnswer = useCallback(
    (answer: number | string, isCorrectFromQuiz?: boolean) => {
      // 중복 호출 방지 가드
      if (isTransitioning || advanceLockRef.current || !gameSet) return;

      setSessionState((prev) => {
        // 배열 범위 체크
        if (prev.currentIndex >= gameSet.items.length) return prev;

        const currentItem = gameSet.items[prev.currentIndex];
        let isCorrect = false;

        // 정답 체크
        if (currentItem.type === "flash4") {
          // Flash4Quiz에서 이미 정답 판정을 완료했으므로 그 결과를 사용
          isCorrect = isCorrectFromQuiz ?? false;
        } else if (currentItem.type === "spell") {
          isCorrect = String(answer).toLowerCase() === currentItem.payload.answer.toLowerCase();
        } else if (currentItem.type === "binaryPassage") {
          // binaryPassage는 handleQuestionAnswer에서 처리
          return prev;
        }

        // 락 활성화 및 전환 상태 설정
        advanceLockRef.current = true;
        setIsTransitioning(true);

        // 피드백 표시
        setFeedbackCorrect(isCorrect);
        setShowFeedback(true);

        // 답변 저장 (함수형 업데이트)
        const newAnswers = [...prev.answers];
        newAnswers[prev.currentIndex] = answer;
        const currentIndex = prev.currentIndex;

        // 기존 타이머 정리
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }

        // 다음 문제로 이동 (정답: 0.6초, 오답: 0.8초)
        const delay = isCorrect ? 650 : 850;
        timeoutRef.current = setTimeout(() => {
          setSessionState((current) => {
            // 배열 범위 재확인
            if (current.currentIndex >= gameSet.items.length - 1) {
              // 마지막 문제면 결과 페이지로
              const endTime = Date.now();
              const result = {
                answers: newAnswers,
                startTime: current.startTime,
                endTime,
                timeSpentSec: Math.floor((endTime - current.startTime) / 1000),
              };
              sessionStorage.setItem("gameResult", JSON.stringify(result));
              setRedirectToResult(true);
              advanceLockRef.current = false;
              setIsTransitioning(false);
              return current;
            }

            // 다음 문제로 이동
            setShowFeedback(false);
            advanceLockRef.current = false;
            setIsTransitioning(false);
            return {
              ...current,
              currentIndex: current.currentIndex + 1,
              answers: newAnswers,
            };
          });
          timeoutRef.current = null;
        }, delay);

        return {
          ...prev,
          answers: newAnswers,
        };
      });
    },
    [gameSet, isTransitioning]
  );

  // Binary Passage용 질문별 답변 처리
  const handleQuestionAnswer = useCallback(
    (questionId: number, answerIndex: number) => {
      if (!gameSet) return;

      setSessionState((prev) => {
        const currentItem = gameSet.items[prev.currentIndex];
        if (currentItem.type !== "binaryPassage") return prev;

        const newAnswers = [...prev.answers];
        const currentAnswers = (newAnswers[prev.currentIndex] as number[]) || [];
        const questionIndex = currentItem.payload.questions.findIndex((q) => q.id === questionId);
        
        if (questionIndex >= 0) {
          currentAnswers[questionIndex] = answerIndex;
          newAnswers[prev.currentIndex] = currentAnswers;
        }

        return {
          ...prev,
          answers: newAnswers,
        };
      });
    },
    [gameSet]
  );

  // Binary Passage 제출 처리
  const handleBinaryPassageSubmit = useCallback(() => {
    // 중복 호출 방지 가드
    if (isTransitioning || advanceLockRef.current || !gameSet) return;

    setSessionState((prev) => {
      // 배열 범위 체크
      if (prev.currentIndex >= gameSet.items.length) return prev;

      const currentItem = gameSet.items[prev.currentIndex];
      if (currentItem.type !== "binaryPassage") return prev;

      const userAnswers = (prev.answers[prev.currentIndex] as number[]) || [];
      const isCorrect = currentItem.payload.questions.every(
        (q, qIdx) => userAnswers[qIdx] === q.answerIndex
      );

      // 락 활성화 및 전환 상태 설정
      advanceLockRef.current = true;
      setIsTransitioning(true);

      setFeedbackCorrect(isCorrect);
      setShowFeedback(true);

      // 기존 타이머 정리
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      // 1.5초 후 다음 문제로
      timeoutRef.current = setTimeout(() => {
        setSessionState((current) => {
          // 배열 범위 재확인
          if (current.currentIndex >= gameSet.items.length - 1) {
            // 마지막 문제면 결과 페이지로
            const endTime = Date.now();
            const result = {
              answers: current.answers,
              startTime: current.startTime,
              endTime,
              timeSpentSec: Math.floor((endTime - current.startTime) / 1000),
            };
            sessionStorage.setItem("gameResult", JSON.stringify(result));
            setRedirectToResult(true);
            advanceLockRef.current = false;
            setIsTransitioning(false);
            return current;
          }

          // 다음 문제로 이동
          setShowFeedback(false);
          advanceLockRef.current = false;
          setIsTransitioning(false);
          return {
            ...current,
            currentIndex: current.currentIndex + 1,
          };
        });
        timeoutRef.current = null;
      }, 1500);

      return prev;
    });
  }, [gameSet, isTransitioning]);

  if (!gameSet) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-neutral-600">로딩 중...</div>
      </div>
    );
  }

  // 배열 범위 체크
  if (sessionState.currentIndex >= gameSet.items.length) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-neutral-600">결과 페이지로 이동 중...</div>
      </div>
    );
  }

  const currentItem = gameSet.items[sessionState.currentIndex];

  return (
    <QuizShell
      currentIndex={sessionState.currentIndex}
      totalCount={gameSet.items.length}
      elapsedSeconds={elapsedSeconds}
      showTimer={true}
    >
      {currentItem.type === "flash4" && (
        <Flash4Quiz
          payload={currentItem.payload}
          onAnswer={(isCorrect, idx, selectedText) => handleAnswer(selectedText || idx, isCorrect)}
          showFeedback={showFeedback}
          isCorrect={feedbackCorrect}
          showCountdown={sessionState.currentIndex === 0} // 첫 문제에만 카운트다운 표시
        />
      )}
      {currentItem.type === "spell" && (
        <SpellQuiz
          payload={currentItem.payload}
          onAnswer={(ans) => handleAnswer(ans)}
          showFeedback={showFeedback}
          isCorrect={feedbackCorrect}
        />
      )}
      {currentItem.type === "binaryPassage" && (
        <BinaryPassageQuiz
          payload={currentItem.payload}
          onAnswer={handleQuestionAnswer}
          onSubmit={handleBinaryPassageSubmit}
          answers={(sessionState.answers[sessionState.currentIndex] as number[]) || []}
          showFeedback={showFeedback}
        />
      )}
    </QuizShell>
  );
}

