"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";

import QuizShell from "@/components/quiz/QuizShell";
import Flash4Quiz from "@/components/quiz/types/Flash4Quiz";
import SpellQuiz from "@/components/quiz/types/SpellQuiz";
import BinaryPassageQuiz from "@/components/quiz/types/BinaryPassageQuiz";

import type { GameSet, QuizItem } from "@/lib/quiz/schema";

// ✅ 핵심: answers에 들어갈 수 있는 타입을 명확히 고정
// - flash4: number | string
// - spell:  string
// - binaryPassage: number[] (문항별 선택 index)
// - 아직 답 안한 경우: null
type AnswerValue = string | number | number[] | null;

type SessionState = {
  currentIndex: number;
  answers: AnswerValue[];
  startTime: number;
  endTime: number | null;
};

export default function PlaySessionPage() {
  const router = useRouter();

  const [gameSet, setGameSet] = useState<GameSet | null>(null);
  const [sessionState, setSessionState] = useState<SessionState>({
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

  // ✅ 브라우저 setTimeout 타입 (NodeJS.Timeout 쓰면 VSCode 빨간줄 자주 남)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 중복 호출 방지 락
  const advanceLockRef = useRef(false);
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
      setElapsedSeconds(Math.floor((Date.now() - sessionState.startTime) / 1000));
    }, 1000);

    return () => clearInterval(interval);
  }, [gameSet, sessionState.startTime]);

  // cleanup
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

  // 범위 넘어가면 결과로
  useEffect(() => {
    if (!gameSet) return;

    if (sessionState.currentIndex >= gameSet.items.length) {
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
  }, [sessionState.currentIndex, gameSet, sessionState.answers, sessionState.startTime]);

  // ✅ binaryPassage answers를 안전하게 꺼내는 유틸
  const getBinaryAnswers = (value: AnswerValue, questionCount: number): number[] => {
    if (Array.isArray(value)) return value as number[];
    // 아직 답 안한 상태는 -1로 채움 (BinaryPassageQuiz가 number[]를 기대하니까)
    return new Array(questionCount).fill(-1);
  };

  // 답변 처리 (flash4 / spell)
  const handleAnswer = useCallback(
    (answer: string | number, isCorrectFromQuiz?: boolean) => {
      if (isTransitioning || advanceLockRef.current || !gameSet) return;

      setSessionState((prev) => {
        if (prev.currentIndex >= gameSet.items.length) return prev;

        const currentItem: QuizItem = gameSet.items[prev.currentIndex];
        if (currentItem.type === "binaryPassage") return prev; // binaryPassage는 별도 처리

        let isCorrect = false;

        if (currentItem.type === "flash4") {
          isCorrect = isCorrectFromQuiz ?? false;
        } else if (currentItem.type === "spell") {
          isCorrect =
            String(answer).toLowerCase() === currentItem.payload.answer.toLowerCase();
        }

        // 락/전환
        advanceLockRef.current = true;
        setIsTransitioning(true);

        setFeedbackCorrect(isCorrect);
        setShowFeedback(true);

        const newAnswers = [...prev.answers];
        newAnswers[prev.currentIndex] = answer;

        if (timeoutRef.current) clearTimeout(timeoutRef.current);

        const delay = isCorrect ? 650 : 850;
        timeoutRef.current = setTimeout(() => {
          setSessionState((current) => {
            const isLast = current.currentIndex >= gameSet.items.length - 1;

            if (isLast) {
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

        return { ...prev, answers: newAnswers };
      });
    },
    [gameSet, isTransitioning]
  );

  // Binary Passage: 질문별 답변 저장
  const handleQuestionAnswer = useCallback(
    (questionId: number, answerIndex: number) => {
      if (!gameSet) return;

      setSessionState((prev) => {
        if (prev.currentIndex >= gameSet.items.length) return prev;

        const currentItem = gameSet.items[prev.currentIndex];
        if (currentItem.type !== "binaryPassage") return prev;

        const questionCount = currentItem.payload.questions.length;

        const newAnswers = [...prev.answers];
        const currentAnswers = getBinaryAnswers(newAnswers[prev.currentIndex], questionCount);

        const qIdx = currentItem.payload.questions.findIndex((q) => q.id === questionId);
        if (qIdx >= 0) currentAnswers[qIdx] = answerIndex;

        newAnswers[prev.currentIndex] = currentAnswers;

        return { ...prev, answers: newAnswers };
      });
    },
    [gameSet]
  );

  // Binary Passage: 제출 처리
  const handleBinaryPassageSubmit = useCallback(() => {
    if (isTransitioning || advanceLockRef.current || !gameSet) return;

    setSessionState((prev) => {
      if (prev.currentIndex >= gameSet.items.length) return prev;

      const currentItem = gameSet.items[prev.currentIndex];
      if (currentItem.type !== "binaryPassage") return prev;

      const questionCount = currentItem.payload.questions.length;
      const userAnswers = getBinaryAnswers(prev.answers[prev.currentIndex], questionCount);

      const isCorrect = currentItem.payload.questions.every(
        (q, idx) => userAnswers[idx] === q.answerIndex
      );

      advanceLockRef.current = true;
      setIsTransitioning(true);

      setFeedbackCorrect(isCorrect);
      setShowFeedback(true);

      if (timeoutRef.current) clearTimeout(timeoutRef.current);

      timeoutRef.current = setTimeout(() => {
        setSessionState((current) => {
          const isLast = current.currentIndex >= gameSet.items.length - 1;

          if (isLast) {
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

          setShowFeedback(false);
          advanceLockRef.current = false;
          setIsTransitioning(false);

          return { ...current, currentIndex: current.currentIndex + 1 };
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
          onAnswer={(isCorrect, idx, selectedText) =>
            handleAnswer(selectedText ?? idx, isCorrect)
          }
          showFeedback={showFeedback}
          isCorrect={feedbackCorrect}
          showCountdown={sessionState.currentIndex === 0}
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
          // ✅ number[] 보장
          answers={getBinaryAnswers(
            sessionState.answers[sessionState.currentIndex],
            currentItem.payload.questions.length
          )}
          showFeedback={showFeedback}
        />
      )}
    </QuizShell>
  );
}
