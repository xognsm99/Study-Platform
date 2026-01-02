"use client";

import { useEffect, useState, useRef, Suspense } from "react";
import { useSearchParams, useRouter, useParams } from "next/navigation";

const KNOWN_QTYPES = new Set([
  "어휘_사전","어휘_영영","어휘_문맥",
  "문법_어법오류","문법_빈칸","문법_배열",
  "본문_제목","본문_물음","본문_일치",
  "대화문_빈칸","대화문_흐름","대화문_응답",
]);

function isLabelLike(s: string) {
  const t = (s ?? "").trim();
  if (!t) return true;
  if (KNOWN_QTYPES.has(t)) return true;
  if (/^[가-힣]+_[가-힣]+$/.test(t)) return true;
  return false;
}

function normStr(v: any): string {
  if (v == null) return "";
  if (typeof v === "string") return v.trim();
  if (typeof v === "number" || typeof v === "boolean") return String(v);
  if (Array.isArray(v)) return v.map(normStr).filter(Boolean).join("\n").trim();
  return "";
}

function deepFindText(v: any): string {
  if (!v) return "";
  if (typeof v === "string") {
    const s = v.trim();
    if (s.length < 6) return "";
    if (isLabelLike(s)) return "";
    return s;
  }
  if (Array.isArray(v)) {
    for (const it of v) {
      const found = deepFindText(it);
      if (found) return found;
    }
    return "";
  }
  if (typeof v === "object") {
    const skip = new Set([
      "qtype","category","grade","subject","difficulty","id","content_hash",
      "answer","answers","correct","solution","explanation","commentary",
      "해설","정답","정답번호",
    ]);
    for (const k of Object.keys(v)) {
      if (skip.has(k)) continue;
      const found = deepFindText((v as any)[k]);
      if (found) return found;
    }
  }
  return "";
}

function getTeacherPassage(item: any): string {
  const c = item?.content ?? {};
  const raw = c?.raw ?? c;

  const candidates = [
    item?.passage,
    raw?.passage,
    raw?.지문,
    raw?.본문,
    raw?.reading,
    raw?.article,
    c?.passage,
    c?.지문,
    c?.본문,
  ];

  for (const v of candidates) {
    const s = String(v ?? "").trim();
    if (s) return s;
  }

  return "";
}

function getTeacherChoices(item: any): string[] {
  const c = item?.content ?? {};
  const raw = c?.raw ?? c;

  const toStr = (x: any) =>
    String(
      typeof x === "string"
        ? x
        : x?.text ?? x?.label ?? x?.value ?? x?.content ?? ""
    ).trim();

  const arrayCandidates = [
    item?.choices,
    raw?.choices,
    raw?.options,
    raw?.candidates,
    raw?.보기,
    raw?.선택지,
    c?.choices,
    c?.options,
    c?.보기,
  ];

  for (const v of arrayCandidates) {
    if (Array.isArray(v) && v.length > 0) {
      return v.map(toStr).filter(Boolean);
    }
    if (v && typeof v === "object" && !Array.isArray(v)) {
      const keys = Object.keys(v).sort((a, b) => Number(a) - Number(b));
      const arr = keys.map((k) => toStr(v[k])).filter(Boolean);
      if (arr.length >= 2) return arr;
    }
  }

  const pick = (o: any, k: string) => (o && o[k] != null ? String(o[k]).trim() : "");
  const sources = [raw, c, item].filter(Boolean);

  for (const src of sources) {
    const arr = [
      pick(src, "보기1"), pick(src, "보기2"), pick(src, "보기3"), pick(src, "보기4"), pick(src, "보기5"),
      pick(src, "option1"), pick(src, "option2"), pick(src, "option3"), pick(src, "option4"), pick(src, "option5"),
      pick(src, "choice1"), pick(src, "choice2"), pick(src, "choice3"), pick(src, "choice4"), pick(src, "choice5"),
      pick(src, "A"), pick(src, "B"), pick(src, "C"), pick(src, "D"), pick(src, "E"),
    ].filter(Boolean);

    if (arr.length >= 2) return arr;
  }

  return [];
}

function getTeacherText(item: any): string {
  const c = item?.content ?? {};
  const raw = c?.raw ?? c;

  const q =
    item?.text ??
    raw?.question ?? raw?.stem ?? raw?.text ?? raw?.prompt ?? raw?.ask ??
    raw?.문제 ?? raw?.질문 ?? raw?.물음 ?? raw?.요구사항 ??
    c?.question ?? c?.문제 ?? c?.질문 ?? "";

  const s = normStr(q);
  if (s && !isLabelLike(s)) return s;

  return deepFindText(raw) || deepFindText(item) || "";
}

function getTeacherTranslation(item: any): string {
  const c = item?.content ?? {};
  const raw = c?.raw ?? c;

  const t =
    raw?.translation ??
    raw?.meaning_ko ??
    raw?.korean ??
    raw?.ko ??
    raw?.해석 ??
    c?.translation ??
    c?.meaning_ko ??
    c?.해석 ??
    "";

  return String(t ?? "").trim();
}

function TeacherPreviewPageContent() {
  const sp = useSearchParams();
  const router = useRouter();
  const params = useParams();
  const locale = (params?.locale as string) || "ko";

  const [items, setItems] = useState<any[]>([]);
  const [counts, setCounts] = useState<any>(null);
  const [dataNotFound, setDataNotFound] = useState(false);
  const [loading, setLoading] = useState(true);
  const [pages, setPages] = useState<Array<{ left: any[]; right: any[] }>>([]);
  const measureRefs = useRef<(HTMLDivElement | null)[]>([]);

  const setId = sp.get("setId");
  const grade = sp.get("grade") ?? "";
  const subject = sp.get("subject") ?? "";
  const unitRaw = sp.get("unit") ?? "";
  const unitLabel =
    unitRaw === "1-3" ? "1~3 단원" :
    unitRaw === "4-6" ? "4~6 단원" :
    unitRaw === "7-9" ? "7~9 단원" :
    unitRaw === "10-12" ? "10~12 단원" :
    unitRaw ? unitRaw : "종합평가";

  useEffect(() => {
    if (!setId) {
      setDataNotFound(true);
      setLoading(false);
      return;
    }

    const raw = sessionStorage.getItem(`examset:${setId}`);
    if (!raw) {
      setDataNotFound(true);
      setLoading(false);
      return;
    }

    try {
      const parsed = JSON.parse(raw);

      const problems = Array.isArray(parsed)
        ? parsed
        : (parsed.items ?? parsed.problems ?? []);

      const safeProblems = problems.map((it: any) => ({
        ...it,
        text: String(it?.text ?? "").trim(),
        passage: String(it?.passage ?? "").trim(),
        choices: Array.isArray(it?.choices) ? it.choices : [],
        answer: it?.answer ?? null,
        explanation: String(it?.explanation ?? "").trim(),
        category: String(it?.category ?? "").trim(),
        qtype: String(it?.qtype ?? "").trim(),
      }));

      setItems(safeProblems);

      const calculatedCounts = safeProblems.reduce((acc: Record<string, number>, it: any) => {
        const c = String(it?.category ?? "").trim();
        acc[c] = (acc[c] ?? 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      setCounts(calculatedCounts);
      setDataNotFound(false);
    } catch (err) {
      console.error("인쇄 데이터 로드 실패:", err);
      setDataNotFound(true);
    } finally {
      setLoading(false);
    }
  }, [setId]);

  // 페이지네이션 로직 - items가 변경될 때 페이지 재계산
  useEffect(() => {
    if (items.length === 0) {
      setPages([]);
      return;
    }

    // 높이 측정 후 페이지 분할
    setTimeout(() => {
      const PAGE_HEIGHT = 1123;
      const HEADER_HEIGHT = 140;
      const CARD_GAP = 16;
      const usableHeight = PAGE_HEIGHT - HEADER_HEIGHT - 64;

      const heights = items.map((_, idx) => {
        const el = measureRefs.current[idx];
        return el ? el.getBoundingClientRect().height + CARD_GAP : 0;
      });

      const newPages: Array<{ left: any[]; right: any[] }> = [];
      let currentPage = { left: [] as any[], right: [] as any[] };
      let leftHeight = 0;
      let rightHeight = 0;
      let isLeftColumn = true;

      items.forEach((item, idx) => {
        const height = heights[idx];

        if (isLeftColumn) {
          if (leftHeight + height <= usableHeight) {
            currentPage.left.push(item);
            leftHeight += height;
          } else {
            // 왼쪽 열이 가득 참 -> 오른쪽 열로 전환
            isLeftColumn = false;
            if (rightHeight + height <= usableHeight) {
              currentPage.right.push(item);
              rightHeight += height;
            } else {
              // 오른쪽 열도 가득 참 -> 새 페이지
              newPages.push(currentPage);
              currentPage = { left: [item], right: [] };
              leftHeight = height;
              rightHeight = 0;
              isLeftColumn = true;
            }
          }
        } else {
          if (rightHeight + height <= usableHeight) {
            currentPage.right.push(item);
            rightHeight += height;
          } else {
            // 오른쪽 열이 가득 차면 새 페이지
            newPages.push(currentPage);
            currentPage = { left: [item], right: [] };
            leftHeight = height;
            rightHeight = 0;
            isLeftColumn = true;
          }
        }
      });

      // 마지막 페이지 추가
      if (currentPage.left.length > 0 || currentPage.right.length > 0) {
        newPages.push(currentPage);
      }

      setPages(newPages);
    }, 100);
  }, [items]);

  const handlePrint = (mode: "question" | "answer") => {
    if (!setId || items.length === 0) return;

    const params = new URLSearchParams({
      mode,
      setId,
      ...(grade && { grade }),
      ...(subject && { subject }),
    });
    router.push(`/ko/teacher/print?${params.toString()}`);
  };

  const handleGoBack = () => {
    router.push(`/${locale}/teacher/build?grade=${grade}&subject=${subject}`);
  };

  // 카드 렌더링 함수
  const renderCard = (item: any, idx: number, forMeasure: boolean = false) => {
    const qtype = item?.qtype ?? item?.content?.raw?.qtype ?? item?.content?.qtype ?? "";
    const passage = getTeacherPassage(item);
    const text = getTeacherText(item);
    const choices = getTeacherChoices(item);
    const tr = getTeacherTranslation(item);

    const isVocabEngEng = qtype === "어휘_영영";
    const isVocabDict = qtype === "어휘_사전";
    const isGrammar = qtype.startsWith("문법_");
    const isDialogue = qtype.startsWith("대화문_");
    const shouldQuestionFirst = isVocabEngEng || isGrammar || isDialogue;

    return (
      <div
        key={item.id ?? idx}
        ref={forMeasure ? (el) => { measureRefs.current[idx] = el; } : undefined}
        className="rounded-2xl bg-white border border-[#EAE7FF] shadow-sm p-4"
      >
        <div className="text-sm font-bold text-[#6E63D5] mb-2">문제 {idx + 1}</div>

        {shouldQuestionFirst ? (
          <>
            <div className="font-semibold whitespace-pre-wrap leading-relaxed text-slate-800">
              {text || "(문제 문장을 찾지 못했습니다)"}
            </div>

            {(passage || tr) && (
              <div className="mt-3 rounded-xl bg-[#F6F4FF] px-4 py-3 text-sm whitespace-pre-wrap leading-relaxed text-slate-800">
                {passage && <div>{passage}</div>}
                {tr && <div className="mt-2 text-slate-700">▶ 해석: {tr}</div>}
              </div>
            )}
          </>
        ) : (
          <>
            {passage && (
              <div className="mb-3 rounded-xl bg-[#F6F4FF] px-4 py-3 text-sm whitespace-pre-wrap leading-relaxed text-slate-800">
                {passage}
              </div>
            )}

            <div className="font-semibold whitespace-pre-wrap leading-relaxed text-slate-800">
              {text || "(문제 문장을 찾지 못했습니다)"}
            </div>

            {isVocabDict && tr && (
              <div className="mt-2 text-sm text-slate-700">▶ 해석: {tr}</div>
            )}
          </>
        )}

        {choices.length > 0 ? (
          <ol className="mt-3 space-y-1 pl-5 text-sm list-decimal text-slate-800 leading-relaxed">
            {choices.map((ch, chIdx) => (
              <li key={chIdx} className="whitespace-pre-wrap leading-relaxed">
                {ch}
              </li>
            ))}
          </ol>
        ) : (
          <div className="mt-3 text-sm text-red-600">
            (보기를 찾지 못했습니다: content 구조 확인 필요)
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-64px)] bg-gradient-to-b from-[#E9E7FF] via-white to-white flex items-center justify-center px-4 py-6 max-[380px]:px-3">
        <div className="text-center text-slate-600 text-sm">로딩 중...</div>
      </div>
    );
  }

  if (dataNotFound || items.length === 0) {
    return (
      <div className="min-h-[calc(100vh-64px)] bg-gradient-to-b from-[#E9E7FF] via-white to-white flex items-center justify-center px-4 py-6 max-[380px]:px-3">
        <div className="mx-auto w-full max-w-[420px] rounded-[28px] bg-white p-6 shadow-sm border border-[#E6E3FF] text-center">
          <div className="mb-4">
            <svg
              className="mx-auto h-10 w-10 text-[#6E63D5]"
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
          <h2 className="text-[15px] font-semibold text-[#6E63D5] mb-2">
            세트 데이터를 찾지 못했습니다
          </h2>
          <p className="text-sm text-slate-600 mb-5">
            세트가 만료되었거나 찾을 수 없습니다. 다시 생성해주세요.
          </p>
          <button
            onClick={handleGoBack}
            className="w-full h-11 rounded-2xl bg-gradient-to-r from-[#6E63D5] to-[#8A7CF0] text-white text-sm font-semibold shadow-[0_12px_26px_rgba(110,99,213,0.25)] hover:from-[#5B52C8] hover:to-[#7A6FE0] transition-all"
          >
            다시 생성하기
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-64px)] bg-gradient-to-b from-[#E9E7FF] via-white to-white px-4 py-6 pb-24 max-[380px]:px-3">
      <div className="mx-auto w-full max-w-[420px]">
        <h1 className="text-[18px] font-semibold text-[#6E63D5]">미리보기</h1>

        <div className="mt-4 rounded-[28px] bg-white shadow-sm border border-[#E6E3FF] p-5">
          <div className="mb-4 space-y-2">
            <div className="flex flex-wrap gap-2 text-xs">
              <span className="rounded-full bg-[#F1EFFF] px-3 py-1 text-[#6E63D5] font-semibold">
                학년 {grade || "-"}
              </span>
              <span className="rounded-full bg-[#F1EFFF] px-3 py-1 text-[#6E63D5] font-semibold">
                과목 {subject || "-"}
              </span>
              <span className="rounded-full bg-[#F1EFFF] px-3 py-1 text-[#6E63D5] font-semibold">
                단원 {unitLabel}
              </span>
              {items.length > 0 && (
                <span className="rounded-full bg-[#F1EFFF] px-3 py-1 text-slate-600 font-semibold">
                  총 {items.length}문항
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-[15px] font-semibold text-[#5B52C8]">문제 목록</h2>
            </div>
            <div className="grid grid-cols-2 gap-2 ml-4">
              <button
                onClick={() => handlePrint("question")}
                className="h-9 px-3 rounded-xl bg-gradient-to-r from-[#6E63D5] to-[#8A7CF0] text-white text-xs font-semibold shadow-[0_8px_18px_rgba(110,99,213,0.25)] hover:from-[#5B52C8] hover:to-[#7A6FE0] active:scale-[0.98] transition-all whitespace-nowrap"
              >
                문제 인쇄
              </button>
              <button
                onClick={() => handlePrint("answer")}
                className="h-9 px-3 rounded-xl bg-gradient-to-r from-[#6E63D5] to-[#8A7CF0] text-white text-xs font-semibold shadow-[0_8px_18px_rgba(110,99,213,0.25)] hover:from-[#5B52C8] hover:to-[#7A6FE0] active:scale-[0.98] transition-all whitespace-nowrap"
              >
                정답 인쇄
              </button>
            </div>
          </div>

          {items.length > 0 && (() => {
            const vocab = counts?.vocabulary ?? 0;
            const gram = counts?.grammar ?? 0;
            const dial = counts?.dialogue ?? 0;
            const read = counts?.reading ?? 0;
            const summary = `어휘 ${vocab} · 문법 ${gram} · 대화문 ${dial} · 본문 ${read}`;
            return (
              <div className="mt-2 text-[13px] text-[#2E2A6A]/70">
                {summary}
              </div>
            );
          })()}
        </div>

        {/* 높이 측정용 숨겨진 영역 */}
        <div style={{ visibility: 'hidden', position: 'absolute', left: '-99999px', width: '420px' }}>
          {items.map((item, idx) => renderCard(item, idx, true))}
        </div>

        {/* 페이지 렌더링 */}
        <div className="mt-5 space-y-6 pb-4">
          {pages.map((page, pageIdx) => (
            <div
              key={pageIdx}
              className="mx-auto bg-white shadow-lg rounded-lg overflow-hidden"
              style={{
                width: '210mm',
                minHeight: '297mm',
                padding: '20mm',
                breakInside: 'avoid',
                pageBreakInside: 'avoid'
              }}
            >
              {/* 헤더 (첫 페이지만) */}
              {pageIdx === 0 && (
                <div className="mb-6 pb-4 border-b-2 border-gray-800">
                  <h1 className="text-xl font-bold text-center mb-2">
                    중 {grade} {subject === 'english' ? '영어' : subject === 'korean' ? '국어' : subject} 시험
                  </h1>
                  <div className="flex justify-between text-sm text-gray-600">
                    <div>날짜: {new Date().toLocaleDateString("ko-KR")}</div>
                    <div>이름: __________________</div>
                  </div>
                </div>
              )}

              {/* 2열 그리드 (데스크탑) */}
              <div className="hidden md:grid md:grid-cols-2 gap-4">
                {/* 왼쪽 열 */}
                <div className="space-y-4">
                  {page.left.map((item) => {
                    const originalIdx = items.findIndex(i => i === item);
                    return renderCard(item, originalIdx, false);
                  })}
                </div>

                {/* 오른쪽 열 */}
                <div className="space-y-4">
                  {page.right.map((item) => {
                    const originalIdx = items.findIndex(i => i === item);
                    return renderCard(item, originalIdx, false);
                  })}
                </div>
              </div>

              {/* 모바일: 1열 (좌→우 순서) */}
              <div className="md:hidden space-y-4">
                {[...page.left, ...page.right].map((item) => {
                  const originalIdx = items.findIndex(i => i === item);
                  return renderCard(item, originalIdx, false);
                })}
              </div>
            </div>
          ))}
        </div>
        </div>
      </div>
  );
}

export default function TeacherPreviewPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <TeacherPreviewPageContent />
    </Suspense>
  );
}
