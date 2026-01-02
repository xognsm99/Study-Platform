"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useParams } from "next/navigation";
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

type PrintData = {
  grade: string;
  subject: string;
  items: any[];
};

function TeacherPrintPageContent() {
  const sp = useSearchParams();
  const params = useParams();
  const locale = (params?.locale as string) || "ko";

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
    window.location.href = `/${locale}/teacher/build?grade=${grade}&subject=${subject}`;
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
        /* 화면에서는 grid 2열 레이아웃 */
        .print-columns {
          max-width: 1040px;
          margin: 0 auto;
          padding: 0 16px;
          column-count: unset;
          column-gap: unset;
          column-fill: unset;

          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px 18px;
          align-items: start;
        }

        .print-item {
          width: 100%;
          margin: 0;
        }

        /* 모바일에서는 1열 */
        @media (max-width: 520px) {
          .print-columns {
            grid-template-columns: 1fr;
          }
        }

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
          /* 프린트에서 레이아웃/짤림 방지 */
          html, body { height: auto !important; overflow: visible !important; }
          /* 화면에서만 쓰는 UI 숨김(필요하면 클래스명은 존재하는 것만 적용) */
          .no-print, header, nav, button, [data-no-print="true"] { display: none !important; }

          /* ✅ 핵심: 프린트에서 본문이 안 찍히는 문제를 강제로 해결 */
          body * { visibility: hidden !important; }
          #print-root, #print-root * { visibility: visible !important; }
          #print-root { position: absolute !important; left: 0 !important; top: 0 !important; width: 100% !important; }

          /* transform/scale 때문에 인쇄가 빈 페이지가 되는 케이스 방지 */
          #print-root, #print-root * { transform: none !important; filter: none !important; }
          /* 색상 출력(선택) */
          * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }

          * {
            background: #fff !important;
            background-color: #fff !important;
            color: #000 !important;
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

          /* 인쇄 시 2열 신문형 컬럼 강제 적용 */
          .print-columns {
            max-width: none;
            margin: 0;
            padding: 0;
            display: block;
            column-count: 2;
            column-gap: 20px;
            column-fill: auto;
          }

          .print-item {
            break-inside: avoid;
            page-break-inside: avoid;
            -webkit-column-break-inside: avoid;
            display: inline-block;
            width: 100%;
            margin-bottom: 14px;
          }

          #print-root .print-grid {
            display: grid !important;
            grid-template-columns: 1fr 1fr !important;
            gap: 16px !important;
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
          #print-root .print-grid {
            display: grid !important;
            grid-template-columns: 1fr !important;
            gap: 16px !important;
          }
          @media (min-width: 768px) {
            #print-root .print-grid {
              grid-template-columns: 1fr 1fr !important;
            }
          }
        }
      `}</style>

      <div id="print-root" className="print-root min-h-screen print:min-h-0 print:h-auto bg-gray-100 print:bg-white">
        <div className="no-print fixed top-4 right-4 z-50 flex gap-2">
          <button
            onClick={() => {
              const params = new URLSearchParams({
                mode: showAnswer ? "question" : "answer",
                ...(setId && { setId }),
                ...(grade && { grade }),
                ...(subject && { subject }),
              });
              window.location.href = `/${locale}/teacher/print?${params.toString()}`;
            }}
            className="no-print h-11 px-5 rounded-2xl bg-[#E9E6FF] text-[#4B3CC4] font-semibold shadow-sm border border-[#D7D0FF] hover:bg-[#DED8FF] transition"
          >
            {showAnswer ? "문제 보기" : "정답 보기"}
          </button>
          <button
            onClick={handlePrint}
            className="no-print h-11 px-5 rounded-2xl bg-gradient-to-r from-[#6E63D5] to-[#8A7CF0] text-white font-semibold shadow-[0_12px_26px_rgba(110,99,213,0.35)] hover:from-[#5B52C8] hover:to-[#7A6FE0] transition"
          >
            인쇄하기
          </button>
        </div>

        <div className="print-container print:p-0 print:shadow-none">
          <div className="print-page print:!p-6">
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

            {/* 문제 본문 - 2열 신문형 컬럼 */}
            <div className="print-columns print-grid">
              {printData.items.map((item: any, idx: number) => (
                <div key={item.id ?? idx} className="print-item">
                  <ProblemRenderer
                    problem={item}
                    number={idx + 1}
                    showAnswer={showAnswer}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default function TeacherPrintPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <TeacherPrintPageContent />
    </Suspense>
  );
}
