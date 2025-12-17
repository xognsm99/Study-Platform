"use client";

import ResultCard from "@/components/ResultCard";

/**
 * 개발 전용 결과 페이지
 * 문제 생성 없이 ResultCard UI를 개발/테스트하기 위한 더미 데이터 페이지
 * 
 * 접속: /dev/result
 */
export default function DevResultPage() {
  // ✅ 더미 데이터 (3회 세트 모드 포함)
  const dummyData = {
    total: 30, // 총 30문항 (10문항 × 3회)
    correct: 21, // 총 정답 21개
    wrong: 9, // 총 오답 9개
    grade: "1학년",
    subject: "english",
    category: "dialogue",
    elapsedTime: 130, // 초 단위 (2분 10초)
    hintUsedCount: 2,
    isTripleMode: true,
    roundResults: [
      {
        round: 1,
        correct: 6,
        wrong: 4,
        total: 10,
        timeMs: 38000, // 38초
        hintUsed: 1,
      },
      {
        round: 2,
        correct: 7,
        wrong: 3,
        total: 10,
        timeMs: 42000, // 42초
        hintUsed: 1,
      },
      {
        round: 3,
        correct: 8,
        wrong: 2,
        total: 10,
        timeMs: 50000, // 50초
        hintUsed: 0,
      },
    ],
  };

  return (
    <div className="mx-auto max-w-4xl p-6">
      {/* DEV 배지 */}
      <div className="mb-4 flex items-center gap-2">
        <span className="rounded-full bg-yellow-100 px-3 py-1 text-xs font-semibold text-yellow-800 border border-yellow-300">
          🧪 DEV RESULT MODE
        </span>
        <span className="text-xs text-gray-500">
          더미 데이터로 결과 UI를 개발/테스트하는 페이지입니다.
        </span>
      </div>

      {/* 결과 카드 (3회 세트 모드) */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold mb-4 text-gray-700">3회 세트 모드 결과</h2>
        <ResultCard
          total={dummyData.total}
          correct={dummyData.correct}
          wrong={dummyData.wrong}
          grade={dummyData.grade}
          subject={dummyData.subject}
          category={dummyData.category}
          elapsedTime={dummyData.elapsedTime}
          hintUsedCount={dummyData.hintUsedCount}
          isTripleMode={dummyData.isTripleMode}
          roundResults={dummyData.roundResults}
          onRetry={() => {
            alert("다시 풀기 버튼 클릭 (개발 모드)");
          }}
          onNewProblems={() => {
            alert("다른 문제 생성 버튼 클릭 (개발 모드)");
          }}
        />
      </div>

      {/* 단일 모드 테스트 */}
      <div className="mb-8 pt-8 border-t border-gray-200">
        <h2 className="text-lg font-semibold mb-4 text-gray-700">단일 모드 결과</h2>
        <ResultCard
          total={10}
          correct={7}
          wrong={3}
          grade="1학년"
          subject="english"
          category="vocab"
          elapsedTime={130}
          hintUsedCount={2}
          isTripleMode={false}
          roundResults={[]}
          onRetry={() => {
            alert("다시 풀기 버튼 클릭 (단일 모드)");
          }}
          onNewProblems={() => {
            alert("다른 문제 생성 버튼 클릭 (단일 모드)");
          }}
        />
      </div>

      {/* 점수별 레벨 테스트 */}
      <div className="mb-8 pt-8 border-t border-gray-200">
        <h2 className="text-lg font-semibold mb-4 text-gray-700">점수별 레벨 테스트</h2>
        <div className="space-y-6">
          {/* A등급 (90점 이상) */}
          <div>
            <h3 className="text-sm font-medium text-gray-600 mb-2">A등급 (90점) - "조아쒀~ 이대로 쭉 가자잉"</h3>
            <ResultCard
              total={10}
              correct={9}
              wrong={1}
              grade="1학년"
              subject="english"
              category="grammar"
              elapsedTime={120}
              hintUsedCount={0}
              isTripleMode={false}
              roundResults={[]}
              onRetry={() => {}}
              onNewProblems={() => {}}
            />
          </div>

          {/* B등급 (80점) */}
          <div>
            <h3 className="text-sm font-medium text-gray-600 mb-2">B등급 (80점) - "여기서 멈출꺼야? A로 향해~"</h3>
            <ResultCard
              total={10}
              correct={8}
              wrong={2}
              grade="1학년"
              subject="english"
              category="body"
              elapsedTime={150}
              hintUsedCount={1}
              isTripleMode={false}
              roundResults={[]}
              onRetry={() => {}}
              onNewProblems={() => {}}
            />
          </div>

          {/* C등급 (70점) */}
          <div>
            <h3 className="text-sm font-medium text-gray-600 mb-2">C등급 (70점) - "조금만 노력 하면 쭉쭉 올라갈꼬양~"</h3>
            <ResultCard
              total={10}
              correct={7}
              wrong={3}
              grade="1학년"
              subject="english"
              category="dialogue"
              elapsedTime={130}
              hintUsedCount={2}
              isTripleMode={false}
              roundResults={[]}
              onRetry={() => {}}
              onNewProblems={() => {}}
            />
          </div>

          {/* D등급 (60점) */}
          <div>
            <h3 className="text-sm font-medium text-gray-600 mb-2">D등급 (60점) - "다음엔 내가 힌트 사용권 더줄께^^"</h3>
            <ResultCard
              total={10}
              correct={6}
              wrong={4}
              grade="1학년"
              subject="english"
              category="vocab"
              elapsedTime={180}
              hintUsedCount={3}
              isTripleMode={false}
              roundResults={[]}
              onRetry={() => {}}
              onNewProblems={() => {}}
            />
          </div>

          {/* E등급 (50점) */}
          <div>
            <h3 className="text-sm font-medium text-gray-600 mb-2">E등급 (50점) - "ㅜㅜ..."</h3>
            <ResultCard
              total={10}
              correct={5}
              wrong={5}
              grade="1학년"
              subject="english"
              category="grammar"
              elapsedTime={200}
              hintUsedCount={3}
              isTripleMode={false}
              roundResults={[]}
              onRetry={() => {}}
              onNewProblems={() => {}}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
