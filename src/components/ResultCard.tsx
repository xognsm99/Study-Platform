"use client";

import { getCategoryLabel } from "@/lib/utils/constants";
import { useRouter, usePathname } from "next/navigation";

type RoundResult = {
  round: number;
  correct: number;
  wrong: number;
  total: number;
  timeMs: number;
  hintUsed: number;
};

type Props = {
  total: number;
  correct: number;
  wrong: number;
  grade: string;
  subject: string;
  category: string;
  // 시간 측정 비활성화: durationSeconds는 향후 확장을 위해 남겨두되 현재는 사용하지 않음
  durationSeconds?: number;
  hintUsedCount?: number;
  isTripleMode?: boolean;
  roundResults?: RoundResult[];
  locale?: string; // locale prop 추가
};

function subjectLabel(subject: string) {
  if (subject === "english") return "영어";
  if (subject === "math") return "수학";
  return subject;
}

function categoryLabel(category: string) {
  // getCategoryLabel 사용 (레거시 호환 포함)
  return getCategoryLabel(category);
}

// 시간 포맷 함수 (초 → mm:ss)
function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

// 시간 포맷 함수 (밀리초 → mm:ss)
function formatTimeMs(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  return formatTime(seconds);
}

// ✅ 레벨 계산 (점수 기반)
function calcRank(scorePct: number): string {
  if (scorePct >= 90) return "A";
  if (scorePct >= 80) return "B";
  if (scorePct >= 70) return "C";
  if (scorePct >= 60) return "D";
  return "E";
}

// ✅ 레벨별 문구
function getRankMessage(rank: string): string {
  switch (rank) {
    case "A":
      return "조아쒀~ 이대로 쭉 가자잉";
    case "B":
      return "여기서 멈출꺼야? A로 향해~";
    case "C":
      return "조금만 노력 하면 쭉쭉 올라갈꼬양~";
    case "D":
      return "다음엔 내가 힌트 사용권 더줄께^^";
    case "E":
      return "ㅜㅜ...";
    default:
      return "";
  }
}

// ✅ 간단한 막대 그래프 컴포넌트
function MiniBarChart({ values, maxValue, labels }: { values: number[]; maxValue: number; labels: string[] }) {
  return (
    <div className="flex gap-2">
      {values.map((value, idx) => {
        const percentage = maxValue > 0 ? (value / maxValue) * 100 : 0;
        return (
          <div key={idx} className="flex-1 flex flex-col gap-2">
            {/* 막대 영역 */}
            <div className="w-full bg-gray-100 rounded-t relative" style={{ height: "80px" }}>
              <div
                className="absolute bottom-0 w-full bg-blue-500 rounded-t transition-all"
                style={{ height: `${percentage}%` }}
              />
            </div>
            {/* 라벨 영역 (가려지지 않도록 분리) */}
            <div className="min-h-[32px] text-center leading-tight">
              <div className="text-xs text-gray-600">{labels[idx]}</div>
              <div className="text-xs font-semibold text-gray-900">{value}%</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ✅ 단일 모드 전용 섹션 컴포넌트
function SingleResultSection({
  correct,
  wrong,
  total,
  scorePct,
  durationSeconds,
  hintUsedCount,
}: {
  correct: number;
  wrong: number;
  total: number;
  scorePct: number;
  durationSeconds: number;
  hintUsedCount: number;
}) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {/* 정답 */}
      <div className="rounded-xl border bg-white p-4">
        <div className="text-xs text-gray-500">정답</div>
        <div className="mt-1 text-2xl font-bold">{correct}</div>
      </div>

      {/* 오답 */}
      <div className="rounded-xl border bg-white p-4">
        <div className="text-xs text-gray-500">오답</div>
        <div className="mt-1 text-2xl font-bold">{wrong}</div>
      </div>

      {/* 총 문항 */}
      <div className="rounded-xl border bg-white p-4">
        <div className="text-xs text-gray-500">총 문항</div>
        <div className="mt-1 text-2xl font-bold">{total}</div>
      </div>

      {/* 점수 */}
      <div className="rounded-xl border bg-white p-4">
        <div className="text-xs text-gray-500">점수</div>
        <div className="mt-1 text-2xl font-bold">{scorePct}</div>
      </div>

      {/* 문제 풀이 시간 (현재는 고정값 또는 미사용) */}
      <div className="rounded-xl border bg-white p-4">
        <div className="text-xs text-gray-500">문제 풀이 시간</div>
        <div className="mt-1 text-lg font-bold">{formatTime(durationSeconds)}</div>
      </div>

      {/* 힌트 사용 횟수 */}
      <div className="rounded-xl border bg-white p-4">
        <div className="text-xs text-gray-500">힌트 사용 횟수</div>
        <div className="mt-1 text-lg font-bold">{hintUsedCount}회</div>
      </div>
    </div>
  );
}

// ✅ 3회 세트 모드 전용 섹션 컴포넌트
function TripleResultSection({
  correct,
  wrong,
  total,
  scorePct,
  durationSeconds,
  hintUsedCount,
  roundResults,
}: {
  correct: number;
  wrong: number;
  total: number;
  scorePct: number;
  durationSeconds: number;
  hintUsedCount: number;
  roundResults: RoundResult[];
}) {
  // ✅ 라운드별 정답률 계산
  const roundScorePcts = roundResults.map((r) =>
    Math.round((r.correct / Math.max(r.total, 1)) * 100)
  );

  return (
    <>
      {/* 라운드별 요약 */}
      <div className="mb-4 space-y-3">
        {roundResults.map((roundResult) => {
          const roundScore = Math.round((roundResult.correct / Math.max(roundResult.total, 1)) * 100);
          return (
            <div key={roundResult.round} className="rounded-xl border bg-white p-4">
              <div className="mb-2 flex items-center justify-between">
                <div className="text-sm font-semibold text-gray-900">
                  {roundResult.round}회차
                </div>
                <div className="text-xs text-gray-500">
                  {formatTimeMs(roundResult.timeMs)} · 힌트 {roundResult.hintUsed}회
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <div className="text-xs text-gray-500">정답</div>
                  <div className="mt-1 text-lg font-bold text-green-600">{roundResult.correct}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500">오답</div>
                  <div className="mt-1 text-lg font-bold text-red-600">{roundResult.wrong}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500">정답률</div>
                  <div className="mt-1 text-lg font-bold">{roundScore}%</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* 총합 요약 */}
      <div className="mb-4 rounded-xl border-2 border-blue-200 bg-blue-50 p-4">
        <div className="text-xs font-semibold text-blue-900 mb-2">총합</div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <div className="text-xs text-blue-700">총 정답</div>
            <div className="mt-1 text-xl font-bold text-blue-900">{correct}</div>
          </div>
          <div>
            <div className="text-xs text-blue-700">총 오답</div>
            <div className="mt-1 text-xl font-bold text-blue-900">{wrong}</div>
          </div>
          <div>
            <div className="text-xs text-blue-700">총 문항</div>
            <div className="mt-1 text-xl font-bold text-blue-900">{total}</div>
          </div>
          <div>
            <div className="text-xs text-blue-700">평균 정답률</div>
            <div className="mt-1 text-xl font-bold text-blue-900">{scorePct}%</div>
          </div>
        </div>
        <div className="mt-3 pt-3 border-t border-blue-200 grid grid-cols-2 gap-3">
          <div>
            <div className="text-xs text-blue-700">총 풀이 시간</div>
            <div className="mt-1 text-sm font-semibold text-blue-900">{formatTime(durationSeconds)}</div>
          </div>
          <div>
            <div className="text-xs text-blue-700">힌트 사용 횟수</div>
            <div className="mt-1 text-sm font-semibold text-blue-900">{hintUsedCount}회</div>
          </div>
        </div>
      </div>

      {/* 3회 그래프 */}
      {roundResults.length === 3 && (
        <div className="mb-4 rounded-xl border bg-gray-50 p-4">
          <div className="text-xs font-semibold text-gray-600 mb-3">최근 3회 그래프</div>
          
          {/* 정답률 그래프 */}
          <div className="mb-4">
            <div className="text-xs text-gray-500 mb-2">정답률(1~3회)</div>
            <MiniBarChart
              values={roundScorePcts}
              maxValue={100}
              labels={["1회", "2회", "3회"]}
            />
          </div>

          {/* 풀이 시간 그래프 */}
          <div>
            <div className="text-xs text-gray-500 mb-2">풀이 시간(1~3회)</div>
            <div className="flex gap-2">
              {roundResults.map((r, idx) => {
                const maxTime = Math.max(...roundResults.map((r) => r.timeMs / 1000));
                const timeSeconds = r.timeMs / 1000;
                const percentage = maxTime > 0 ? (timeSeconds / maxTime) * 100 : 0;
                return (
                  <div key={r.round} className="flex-1 flex flex-col gap-2">
                    {/* 막대 영역 */}
                    <div className="w-full bg-gray-100 rounded-t relative" style={{ height: "80px" }}>
                      <div
                        className="absolute bottom-0 w-full bg-green-500 rounded-t transition-all"
                        style={{ height: `${percentage}%` }}
                      />
                    </div>
                    {/* 라벨 영역 (가려지지 않도록 분리) */}
                    <div className="min-h-[32px] text-center leading-tight">
                      <div className="text-xs text-gray-600">{idx + 1}회</div>
                      <div className="text-xs font-semibold text-gray-900">{Math.round(timeSeconds)}초</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default function ResultCard({
  total,
  correct,
  wrong,
  grade,
  subject,
  category,
  durationSeconds = 0,
  hintUsedCount = 0,
  isTripleMode = false,
  roundResults = [],
  locale: localeProp,
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const subjText = subjectLabel(subject);
  const catText = categoryLabel(category);

  const safeTotal = Math.max(total, 1);
  const scorePct = Math.round((correct / safeTotal) * 100);
  const rank = calcRank(scorePct);
  const rankMessage = getRankMessage(rank);

  // ✅ locale 추출 (prop 우선, 없으면 경로에서 추출, 기본값 "ko")
  const locale = localeProp ?? pathname?.split("/")[1] ?? "ko";

  // ✅ 학생 퀴즈 페이지 href 빌더
  const buildStudentQuizHref = () => {
    const l = locale ?? "ko";
    
    // grade/subject/category 값이 없으면 최소한 학생 홈으로
    if (!grade || !subject || !category) return `/${l}/student`;
    
    // ✅ 학생 퀴즈 라우트(프로젝트에 이미 존재): /student/[grade]/[subject]/[category]
    return `/${l}/student/${encodeURIComponent(grade)}/${subject}/${category}`;
  };

  // ✅ 다시 풀기 (같은 카테고리로 바로 돌아가서 재시작)
  const onRetry = () => {
    router.push(buildStudentQuizHref());
  };

  // ✅ 다른 문제 생성 (역시 같은 화면으로 가서 새로 시작)
  // 만약 캐시 때문에 화면이 안 바뀌면 ts를 붙여 강제
  const onNew = () => {
    const href = buildStudentQuizHref();
    router.push(`${href}?ts=${Date.now()}`);
  };

  // ✅ 부모 리포트 생성 및 공유
  const handleShareToParent = async () => {
    const reportId = `report-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const reportData = {
      id: reportId,
      grade,
      subject,
      category,
      total,
      correct,
      wrong,
      scorePct,
      rank,
      // durationSeconds는 부모 리포트에서는 밀리초 단위로 durationMs에 저장 (백엔드 호환용)
      durationMs: durationSeconds * 1000,
      hintUsedCount,
      isTripleMode,
      roundResults,
      createdAt: new Date().toISOString(),
    };

    // localStorage에 저장
    try {
      localStorage.setItem("lastParentReport", JSON.stringify(reportData));
    } catch (e) {
      console.error("Failed to save report to localStorage", e);
    }

    // Web Share API 또는 클립보드 복사
    const reportUrl = `${window.location.origin}/parent/report/${reportId}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${grade} ${subjText} ${catText} 학습 결과`,
          text: `학습 결과를 확인해보세요!`,
          url: reportUrl,
        });
      } catch (err) {
        // 사용자가 공유를 취소한 경우
        if ((err as Error).name !== "AbortError") {
          console.error("Share failed", err);
          // 클립보드로 대체
          await navigator.clipboard.writeText(reportUrl);
          alert("링크가 클립보드에 복사되었습니다!");
        }
      }
    } else {
      // 클립보드 복사
      try {
        await navigator.clipboard.writeText(reportUrl);
        alert("링크가 클립보드에 복사되었습니다!\n\n부모님께 전달해주세요.");
      } catch (e) {
        alert(`부모 리포트 링크:\n${reportUrl}\n\n위 링크를 복사해서 부모님께 전달해주세요.`);
      }
    }
  };

  // ✅ 3세트 모드 여부 확인 (명확한 조건)
  const isActuallyTripleMode = Boolean(isTripleMode === true && roundResults && roundResults.length > 0);

  return (
    <div className="rounded-2xl border bg-white p-6 shadow-sm text-slate-900">
      <div className="mb-4 text-xs text-gray-500">
        {grade} · {subjText} · {catText}
        {isActuallyTripleMode && " · 3회 세트 완료"}
      </div>

      <h2 className="mb-4 text-lg font-bold">학습 결과</h2>

      {/* ✅ 조건부 렌더링: 3세트 모드 vs 단일 모드 (완전 분리) */}
      {isActuallyTripleMode ? (
        /* ✅ 3회 세트 모드 전용 섹션 */
        <TripleResultSection
          correct={correct}
          wrong={wrong}
          total={total}
          scorePct={scorePct}
          durationSeconds={durationSeconds}
          hintUsedCount={hintUsedCount}
          roundResults={roundResults}
        />
      ) : (
        /* ✅ 단일 모드 전용 섹션 */
        <SingleResultSection
          correct={correct}
          wrong={wrong}
          total={total}
          scorePct={scorePct}
          durationSeconds={durationSeconds}
          hintUsedCount={hintUsedCount}
        />
      )}

      {/* 간이 레벨 */}
      <div className="mt-4 rounded-xl bg-gray-50 p-4">
        <div className="text-xs font-semibold text-gray-600">간이 레벨</div>
        <div className="mt-1 text-2xl font-bold">{rank}</div>
        <p className="mt-2 text-sm text-gray-600">{rankMessage}</p>
      </div>

      {/* 버튼 영역 */}
      <div className="mt-6">
        {/* ✅ 무료 사용자도 사용 가능: 다시 풀기 / 다른 문제 생성 */}
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={onRetry}
            className="rounded-lg bg-slate-200 px-4 py-3 text-sm font-semibold text-slate-900 transition-colors hover:bg-slate-300"
          >
            다시 풀기
          </button>
          <button
            type="button"
            onClick={onNew}
            className="rounded-lg bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-slate-800"
          >
            다른 문제 생성
          </button>
        </div>
      </div>
    </div>
  );
}
