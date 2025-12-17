"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { extractProblemText } from "@/lib/problem-text";
import { ProblemRenderer } from "@/components/teacher/ProblemRenderer";

function escapeHtml(s: string) {
  return s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function toPassageHtml(passage: string) {
  const safe = escapeHtml(passage ?? "");
  return safe
    .replace(/_{3,}/g, '<span class="blank-box"></span>')
    .replace(/\r?\n/g, "<br/>");
}

// ✅ 인쇄 컴포넌트 안에 유틸로 추가
function pickRaw(it: any) {
  return it?.content?.raw ?? it?.content ?? it ?? {};
}

function pickPassage(it: any) {
  const raw = pickRaw(it);
  return String(it?.passage ?? raw?.passage ?? "");
}

function pickQuestion(it: any) {
  const raw = pickRaw(it);
  return String(it?.question ?? raw?.question ?? "");
}

function pickChoices(it: any) {
  const raw = pickRaw(it);
  const c = it?.choices ?? raw?.choices ?? [];
  return Array.isArray(c) ? c : [];
}

function pickExplanation(it: any) {
  const raw = pickRaw(it);
  return String(it?.explanation ?? raw?.explanation ?? "");
}

function pickAnswerNo(it: any) {
  const raw = pickRaw(it);
  return it?.answer_no ?? raw?.answer_no ?? null;
}

export default function TeacherPrintPage() {
  const sp = useSearchParams();
  const router = useRouter();
  const [printData, setPrintData] = useState<PrintData | null>(null);
  const [dataNotFound, setDataNotFound] = useState(false);

  const mode = sp.get("mode") ?? "question";
  const setId = sp.get("setId");
  const grade = sp.get("grade") ?? "";
  const subject = sp.get("subject") ?? "";
  const showAnswer = mode === "answer";

  useEffect(() => {
    // setId로 sessionStorage에서 데이터 복구
    if (setId) {
      const raw = sessionStorage.getItem(`examset:${setId}`);
      if (raw) {
        try {
          const problems = JSON.parse(raw);
          setPrintData({
            grade,
            subject,
            items: problems,
          });
          setDataNotFound(false);
        } catch (err) {
          console.error("인쇄 데이터 로드 실패:", err);
          setDataNotFound(true);
        }
      } else {
        setDataNotFound(true);
      }
    } else {
      // 레거시: teacher_print_data로 복구 시도
      const stored = sessionStorage.getItem("teacher_print_data");
      if (stored) {
        try {
          setPrintData(JSON.parse(stored));
          setDataNotFound(false);
        } catch (err) {
          console.error("인쇄 데이터 로드 실패:", err);
          setDataNotFound(true);
        }
      } else {
        setDataNotFound(true);
      }
    }
  }, [setId, grade, subject]);

  const handlePrint = () => {
    window.print();
  };

  const getSubjectLabel = (subject: string) => {
    const labels: Record<string, string> = {
      english: "영어",
      korean: "국어",
      social: "사회",
    };
    return labels[subject.toLowerCase()] ?? subject;
  };

  const handleGoBack = () => {
    router.push(`/teacher/build?grade=${grade}&subject=${subject}`);
  };

  if (dataNotFound || !printData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-10">
        <div className="max-w-md w-full rounded-2xl bg-white p-8 shadow-sm ring-1 ring-gray-100 text-center">
          <div className="mb-4">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            세트가 없습니다
          </h2>
          <p className="text-sm text-gray-600 mb-6">
            세트가 만료되었거나 찾을 수 없습니다. 다시 생성해주세요.
          </p>
          <button
            onClick={handleGoBack}
            className="w-full rounded-lg bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-700"
          >
            다시 생성하기
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <style jsx global>{`
        .problem { margin: 14px 0; page-break-inside: avoid; }
        .no { font-weight: 700; margin: 0 0 6px; color: #000 !important; }
        .passage { background: #f6f7f9; padding: 10px; border-radius: 10px; margin-bottom: 8px; white-space: pre-wrap; color: #000 !important; }
        .question {
          display: block !important;
          visibility: visible !important;
          color: #000 !important;
          font-size: 14px !important;
          font-weight: 700 !important;
          margin: 8px 0 6px !important;
        }
        .choices { margin: 0 0 0 18px; }
        .blank-box { display:inline-block; width: 220px; height: 18px; background:#e5e7eb; border-radius:4px; vertical-align:middle; }
        @media print { 
          * {
            background: #fff !important;
            background-color: #fff !important;
            color: #000 !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          body { 
            background: white !important;
            background-color: white !important;
            color: #000 !important;
          }
          .print-root,
          .print-root * {
            background: #fff !important;
            background-color: #fff !important;
            color: #000 !important;
          }
          .no-print { display:none !important; }
          .print-page {
            page-break-after: always;
            page-break-inside: avoid;
            background: #fff !important;
            background-color: #fff !important;
            color: #000 !important;
            padding: 24px 28px;
          }
          .print-page:last-child {
            page-break-after: auto;
          }
        }

        .print-header {
          margin-bottom: 18px;
          padding-bottom: 12px;
          border-bottom: 2px solid #111827;
        }

        .print-title {
          font-size: 22px;
          font-weight: 800;
          letter-spacing: -0.3px;
          text-align: center;
          margin: 0;
        }

        .print-meta {
          margin-top: 8px;
          display: flex;
          justify-content: space-between;
          font-size: 12px;
          color: #374151;
        }

        .print-problem {
          margin-top: 14px;
          padding: 14px 16px;
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          background: #ffffff;
          page-break-inside: avoid;
          break-inside: avoid;
        }

        .print-problem-no {
          font-size: 12px;
          font-weight: 800;
          color: #111827;
          margin-bottom: 8px;
        }

        .print-passage {
          background: #f3f4f6;
          border: 1px solid #e5e7eb;
          border-radius: 10px;
          padding: 10px 12px;
          margin-bottom: 10px;
          font-size: 13px;
          line-height: 1.55;
          white-space: pre-wrap;
        }

        .print-question {
          font-size: 15px;
          font-weight: 700;
          line-height: 1.55;
          white-space: pre-wrap;
        }

        .print-choices {
          margin-top: 10px;
          padding-left: 22px;
          list-style-type: decimal !important;
          list-style-position: outside !important;
          font-size: 13px;
          line-height: 1.55;
        }

        .print-choices li {
          display: list-item !important;
          margin: 3px 0;
          white-space: pre-wrap;
        }

        .print-explain {
          margin-top: 10px;
          font-size: 12px;
          line-height: 1.55;
          color: #374151;
        }

        .print-answerbox {
          margin-top: 10px;
          padding-top: 8px;
          border-top: 1px dashed #d1d5db;
          font-size: 12px;
          color: #374151;
        }

        .print-answerline {
          display: flex;
          gap: 8px;
          align-items: baseline;
          margin-bottom: 6px;
        }

        .print-answerline .label {
          font-weight: 800;
          color: #111827;
        }

        .print-answerline .value {
          font-weight: 800;
        }
        @media screen {
          .print-container {
            max-width: 210mm;
            margin: 0 auto;
            padding: 20mm;
            background: white;
            box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
          }
        }
      `}</style>

      <div className="print-root min-h-screen bg-gray-100">
        <div className="no-print fixed top-4 right-4 z-50 flex gap-2">
          <button
            onClick={() => {
              const params = new URLSearchParams({
                mode: showAnswer ? "question" : "answer",
                ...(setId && { setId }),
                ...(grade && { grade }),
                ...(subject && { subject }),
              });
              router.push(`/teacher/print?${params.toString()}`);
            }}
            className="no-print rounded-lg bg-gray-600 px-4 py-2 text-sm font-semibold text-white shadow-lg hover:bg-gray-700"
          >
            {showAnswer ? "문제 보기" : "정답 보기"}
          </button>
          <button
            onClick={handlePrint}
            className="no-print rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white shadow-lg hover:bg-blue-700"
          >
            인쇄하기
          </button>
        </div>

        <div className="print-container">
          <div className="print-page">
            {/* ===== Print Header ===== */}
            <div className="print-header">
              <h1 className="print-title">중 {printData.grade} {getSubjectLabel(printData.subject)} 시험</h1>

              <div className="print-meta">
                <div>날짜: {new Date().toLocaleDateString("ko-KR")}</div>
                <div>{showAnswer ? "선생님:" : "이름:"} __________________</div>
              </div>

              {showAnswer && (
                <div className="mt-2 text-lg font-bold text-red-600">정답지</div>
              )}
            </div>

            {/* 문제 본문 */}
            <div className="space-y-6">
              {printData.items.map((item: any, idx: number) => (
                <ProblemRenderer
                  key={item.id ?? idx}
                  problem={item}
                  number={idx + 1}
                  showAnswer={showAnswer}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

