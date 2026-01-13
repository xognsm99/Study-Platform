"use client";

import { useMemo, useState, Suspense } from "react";
import { useRouter, useSearchParams, useParams } from "next/navigation";

type Plan = {
  vocabulary: number;
  dialogue: number;
  grammar: number;
  reading: number;
};

const TOTAL = 20;

// 선택된 카테고리에 20문항을 균등 분배
function buildPlan(selected: Array<keyof Plan>): Plan {
  const base: Plan = { vocabulary: 0, dialogue: 0, grammar: 0, reading: 0 };

  const targets = selected.length ? selected : (["vocabulary", "dialogue", "grammar", "reading"] as Array<keyof Plan>);

  const each = Math.floor(TOTAL / targets.length);
  let remainder = TOTAL - each * targets.length;

  for (const k of targets) base[k] = each;
  // 나머지는 앞에서부터 1개씩 더
  for (let i = 0; i < targets.length && remainder > 0; i++, remainder--) {
    base[targets[i]] += 1;
  }

  return base;
}

function TeacherBuildPageContent() {
  const router = useRouter();
  const params = useParams();
  const locale = (params?.locale as string) || "ko";
  const sp = useSearchParams();

  // 기존 라우팅에 맞춰 grade/subject/unit는 query에서 받는다고 가정
  const grade = Number(sp.get("grade") ?? "2");
  const subject = (sp.get("subject") ?? "english").toLowerCase();
  const unit = (sp.get("unit") ?? "") as string;

  const unitLabel =
    unit === "u1" ? "1단원" :
    unit === "u2" ? "2단원" :
    unit === "u3" ? "3단원" :
    unit === "u4" ? "4단원" :
    unit === "u5" ? "5단원" :
    unit === "u6" ? "6단원" :
    unit === "u7" ? "7단원" :
    unit === "u8" ? "8단원" :
    unit === "u9" ? "9단원" :
    unit === "u10" ? "10단원" :
    unit === "u11" ? "11단원" :
    unit === "u12" ? "12단원" :
    unit === "mid1" ? "1학기 중간고사" :
    unit === "final1" ? "1학기 기말고사" :
    unit === "mid2" ? "2학기 중간고사" :
    unit === "final2" ? "2학기 기말고사" :
    unit === "overall" ? "종합평가" :
    unit ? unit : "종합평가";

  const [selVocab, setSelVocab] = useState(true);
  const [selDialogue, setSelDialogue] = useState(true);
  const [selGrammar, setSelGrammar] = useState(true);
  const [selReading, setSelReading] = useState(true);

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [dbgStatus, setDbgStatus] = useState<string>("");
  const [dbgRaw, setDbgRaw] = useState<string>("");
  const [dbgInfo, setDbgInfo] = useState<string>("");

  const selectedKeys = useMemo(() => {
    const arr: Array<keyof Plan> = [];
    if (selVocab) arr.push("vocabulary");
    if (selDialogue) arr.push("dialogue");
    if (selGrammar) arr.push("grammar");
    if (selReading) arr.push("reading");
    return arr;
  }, [selVocab, selDialogue, selGrammar, selReading]);

  const plan = useMemo(() => buildPlan(selectedKeys), [selectedKeys]);
  const total = plan.vocabulary + plan.grammar + plan.dialogue + plan.reading;

  async function onCompose(mode?: "overall" | "custom") {
    setErr(null);
    setLoading(true);
    setDbgStatus("");
    setDbgRaw("");
    setDbgInfo("");

    try {
      // plan 결정
      const plan = mode === "overall" 
        ? { vocabulary: 4, grammar: 4, dialogue: 6, reading: 6 }
        : buildPlan(selectedKeys);

      if (mode === "custom" && selectedKeys.length === 0) {
        setErr("최소 1개 이상 체크하세요.");
        return;
      }

      const res = await fetch(`/api/teacher/compose`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ grade, subject, plan }),
      });

      const raw = await res.text();
      setDbgStatus(`HTTP ${res.status}`);
      setDbgRaw(raw.slice(0, 2000)); // 너무 길면 잘라서

      let data: any = null;
      try {
        data = raw ? JSON.parse(raw) : null;
      } catch {
        throw new Error(`응답이 JSON이 아님 (HTTP ${res.status})`);
      }

      if (!res.ok) {
        throw new Error(data?.error?.message ?? data?.message ?? `HTTP ${res.status}`);
      }

      const items = data?.items ?? data?.resultItems ?? [];
      const first = items?.[0] ?? null;

      setDbgInfo(
        [
          `items.length=${Array.isArray(items) ? items.length : "not-array"}`,
          `firstKeys=${first ? Object.keys(first).join(",") : "none"}`,
          `firstText=${first?.text ? String(first.text).slice(0, 60) : "EMPTY"}`,
        ].join(" | ")
      );

      // ✅ 응답 검증: items 배열 및 길이 확인
      if (!Array.isArray(items)) {
        throw new Error("응답이 배열이 아닙니다. 서버 오류일 수 있습니다.");
      }

      if (items.length !== 20) {
        throw new Error(`예상된 문항 수는 20개인데, 실제로는 ${items.length}개입니다.`);
      }

      // 세션스토리지 정리 (예전 examset 제거)
      Object.keys(sessionStorage)
        .filter(k => k.startsWith("examset:"))
        .forEach(k => sessionStorage.removeItem(k));

      // setId 생성 및 저장
      const setId = crypto.randomUUID();
      sessionStorage.setItem(`examset:${setId}`, JSON.stringify(items));
      router.push(`/${locale}/teacher/preview?setId=${setId}&grade=${grade}&subject=${subject}&unit=${unit}`);
    } catch (e: any) {
      setErr(e?.message ?? String(e));
      // 에러 발생 시 sessionStorage 저장/라우팅 하지 않음
    } finally {
      setLoading(false);
    }
  }

  const handleRetry = () => {
    // 동일 요청 재시도 (종합평가)
    onCompose("overall");
  };

  return (
    <div className="px-4 pt-4 pb-24 max-[380px]:px-3 max-[380px]:pt-3">
      <div className="mx-auto w-full max-w-md">
        <h1 className="text-lg font-semibold text-[#6E63D5] max-[380px]:text-base mb-6">문제 구성</h1>

        <div className="rounded-[28px] bg-white shadow-sm p-5 max-[380px]:p-4">
          <div className="mb-4 text-base text-gray-600">
            <div>학년: <span className="font-semibold text-gray-900">{grade}</span></div>
            <div>과목: <span className="font-semibold text-gray-900">{subject}</span></div>
            <div className="text-base text-[#2E2A6A]">
              단원: <span className="font-semibold">{unitLabel}</span>
            </div>

            <div className="text-xs text-[#2E2A6A]">
             (☆프로필에서 변경 가능)
            </div>

          </div>

          <div className="grid grid-cols-2 gap-2 max-[380px]:gap-2">
            <button
              type="button"
              onClick={() => setSelVocab(!selVocab)}
              aria-pressed={selVocab}
              className={`h-14 max-[380px]:h-10 rounded-2xl border px-5 py-3 transition-all active:scale-[0.99] ${
                selVocab
                  ? "border-[#2563eb] bg-[#EFF6FF] shadow-[0_8px_20px_rgba(37,99,235,0.18)] hover:bg-[#DBEAFE]"
                  : "border-[#DBEAFE] bg-white hover:border-[#93C5FD] hover:bg-sky-50"
              }`}
            >
              <span className="text-lg max-[380px]:text-xs font-semibold text-[#1e40af]">
                어 휘
              </span>
            </button>

            <button
              type="button"
              onClick={() => setSelGrammar(!selGrammar)}
              aria-pressed={selGrammar}
              className={`h-14 max-[380px]:h-10 rounded-2xl border px-5 py-3 transition-all active:scale-[0.99] ${
                selGrammar
                  ? "border-[#2563eb] bg-[#EFF6FF] shadow-[0_8px_20px_rgba(37,99,235,0.18)] hover:bg-[#DBEAFE]"
                  : "border-[#DBEAFE] bg-white hover:border-[#93C5FD] hover:bg-sky-50"
              }`}
            >
              <span className="text-lg max-[380px]:text-xs font-semibold text-[#1e40af]">
                문 법
              </span>
            </button>

            <button
              type="button"
              onClick={() => setSelReading(!selReading)}
              aria-pressed={selReading}
              className={`h-14 max-[380px]:h-10 rounded-2xl border px-5 py-3 transition-all active:scale-[0.99] ${
                selReading
                  ? "border-[#2563eb] bg-[#EFF6FF] shadow-[0_8px_20px_rgba(37,99,235,0.18)] hover:bg-[#DBEAFE]"
                  : "border-[#DBEAFE] bg-white hover:border-[#93C5FD] hover:bg-sky-50"
              }`}
            >
              <span className="text-lg max-[380px]:text-xs font-semibold text-[#1e40af]">
                본 문
              </span>
            </button>

            <button
              type="button"
              onClick={() => setSelDialogue(!selDialogue)}
              aria-pressed={selDialogue}
              className={`h-14 max-[380px]:h-10 rounded-2xl border px-5 py-3 transition-all active:scale-[0.99] ${
                selDialogue
                  ? "border-[#2563eb] bg-[#EFF6FF] shadow-[0_8px_20px_rgba(37,99,235,0.18)] hover:bg-[#DBEAFE]"
                  : "border-[#DBEAFE] bg-white hover:border-[#93C5FD] hover:bg-sky-50"
              }`}
            >
              <span className="text-lg max-[380px]:text-xs font-semibold text-[#1e40af]">
                대화문
              </span>
            </button>
          </div>

          <div className="mt-2 rounded-2xl bg-violet-50 px-4 py-3 text-sm">
            <div className="text-gray-600 mb-2">선택 / 자동 분배(총 {total}문항)</div>
            <div className="grid grid-cols-2 gap-2 text-gray-900">
              <div>어휘: <b>{plan.vocabulary}</b></div>
              <div>문법: <b>{plan.grammar}</b></div>
              <div>본문: <b>{plan.reading}</b></div>
              <div>대화문: <b>{plan.dialogue}</b></div>
            </div>
          </div>

          {err && (
            <div className="mt-4 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600 space-y-3">
              <div className="font-semibold">오류 발생</div>
              <div>{err}</div>
              <button
                onClick={handleRetry}
                disabled={loading}
                className="mt-2 rounded-full bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60"
              >
                다시 생성
              </button>
            </div>
          )}

          <div className="mt-6 grid gap-3 max-[380px]:gap-2">
            {/* ✅ 종합평가: 시험지 비율 고정 */}
            <button
              onClick={() => onCompose("overall")}
              disabled={loading}
              className="w-full h-14 max-[380px]:h-10 rounded-2xl bg-gradient-to-r from-[#6E63D5] to-[#8A7CF0] px-4 text-lg max-[380px]:text-xs text-white font-semibold shadow-[0_12px_26px_rgba(110,99,213,0.35)] hover:from-[#5B52C8] hover:to-[#7A6FE0] transition-all disabled:cursor-not-allowed disabled:bg-gray-300 disabled:hover:bg-gray-300 disabled:opacity-50 disabled:from-gray-300 disabled:to-gray-300"
            >
              {loading ? "종합평가 생성 중..." : "종합평가"}
            </button>

            {/* ✅ 문제 생성: 체크박스 기반 */}
            <button
              onClick={() => onCompose("custom")}
              disabled={loading}
              className="w-full h-14 max-[380px]:h-10 rounded-2xl bg-gradient-to-r from-[#6E63D5] to-[#8A7CF0] px-4 text-lg max-[380px]:text-xs text-white font-semibold shadow-[0_12px_26px_rgba(110,99,213,0.35)] hover:from-[#5B52C8] hover:to-[#7A6FE0] transition-all disabled:cursor-not-allowed disabled:bg-gray-300 disabled:hover:bg-gray-300 disabled:opacity-50 disabled:from-gray-300 disabled:to-gray-300"
            >
              {loading ? "문제 생성 중..." : "문제 생성"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function TeacherBuildPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <TeacherBuildPageContent />
    </Suspense>
  );
}
