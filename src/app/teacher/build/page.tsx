"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

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

export default function TeacherBuildPage() {
  const router = useRouter();
  const sp = useSearchParams();

  // 기존 라우팅에 맞춰 grade/subject는 query에서 받는다고 가정
  const grade = Number(sp.get("grade") ?? "2");
  const subject = (sp.get("subject") ?? "english").toLowerCase();

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

      const res = await fetch("/api/teacher/compose", {
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
      router.push(`/teacher/preview?setId=${setId}&grade=${grade}&subject=${subject}`);
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
    <main className="min-h-screen bg-white">
      <div className="mx-auto max-w-3xl px-5 py-10">
        <h1 className="text-2xl font-bold mb-6">문제 구성</h1>

        <div className="rounded-2xl bg-slate-900 text-white p-6 shadow-sm">
          <div className="mb-4 text-sm opacity-90">
            <div>학년: <span className="font-semibold">{grade}</span></div>
            <div>과목: <span className="font-semibold">{subject}</span></div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <label className="flex items-center gap-3 rounded-xl bg-white/10 px-4 py-4 cursor-pointer select-none">
              <input
                type="checkbox"
                className="h-5 w-5"
                checked={selVocab}
                onChange={(e) => setSelVocab(e.target.checked)}
              />
              <span className="font-semibold">어휘</span>
            </label>

            <label className="flex items-center gap-3 rounded-xl bg-white/10 px-4 py-4 cursor-pointer select-none">
              <input
                type="checkbox"
                className="h-5 w-5"
                checked={selGrammar}
                onChange={(e) => setSelGrammar(e.target.checked)}
              />
              <span className="font-semibold">문법</span>
            </label>

            <label className="flex items-center gap-3 rounded-xl bg-white/10 px-4 py-4 cursor-pointer select-none">
              <input
                type="checkbox"
                className="h-5 w-5"
                checked={selReading}
                onChange={(e) => setSelReading(e.target.checked)}
              />
              <span className="font-semibold">본문</span>
            </label>

            <label className="flex items-center gap-3 rounded-xl bg-white/10 px-4 py-4 cursor-pointer select-none">
              <input
                type="checkbox"
                className="h-5 w-5"
                checked={selDialogue}
                onChange={(e) => setSelDialogue(e.target.checked)}
              />
              <span className="font-semibold">대화문</span>
            </label>
          </div>

          <div className="mt-5 rounded-xl bg-white/5 px-4 py-3 text-sm">
            <div className="opacity-80 mb-2">자동 분배(총 {total}문항)</div>
            <div className="grid grid-cols-2 gap-2">
              <div>어휘: <b>{plan.vocabulary}</b></div>
              <div>문법: <b>{plan.grammar}</b></div>
              <div>본문: <b>{plan.reading}</b></div>
              <div>대화문: <b>{plan.dialogue}</b></div>
            </div>
          </div>

          {err && (
            <div className="mt-4 rounded-xl bg-red-500/20 px-4 py-3 text-sm text-red-100 space-y-3">
              <div className="font-semibold">오류 발생</div>
              <div>{err}</div>
              <button
                onClick={handleRetry}
                disabled={loading}
                className="mt-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60"
              >
                다시 생성
              </button>
            </div>
          )}

          <div className="mt-6 grid gap-3">
            {/* ✅ 종합평가: 시험지 비율 고정 */}
            <button
              onClick={() => onCompose("overall")}
              disabled={loading}
              className="w-full rounded-2xl bg-blue-600 py-5 text-lg font-bold hover:bg-blue-500 disabled:opacity-60"
            >
              {loading ? "종합평가 생성 중..." : "종합평가"}
            </button>

            {/* ✅ 문제 생성: 체크박스 기반 */}
            <button
              onClick={() => onCompose("custom")}
              disabled={loading}
              className="w-full rounded-2xl bg-emerald-500 py-5 text-lg font-bold hover:bg-emerald-400 disabled:opacity-60"
            >
              {loading ? "문제 생성 중..." : "문제 생성"}
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
