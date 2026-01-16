"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { WORD_ORDER_QUESTIONS, type WordOrderQuestion } from "./questions";

function normalize(s: string) {
  return s
    .replaceAll("'", "'")
    .replace(/[.!?]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

export default function ReadingAb2Page() {
  const router = useRouter();
  const params = useParams() as { locale?: string };
  const locale = params?.locale ?? "ko";

  const questions = WORD_ORDER_QUESTIONS;

  const [idx, setIdx] = useState(0);
  const q = questions[idx];

  // bank: 아직 안 고른 조각 / picked: 답칸에 들어간 조각
  const [bank, setBank] = useState<string[]>([]);
  const [picked, setPicked] = useState<string[]>([]);
  const [checked, setChecked] = useState<null | { ok: boolean; msg: string }>(null);

  useEffect(() => {
    if (!q) return;
    setBank(q.tokens);
    setPicked([]);
    setChecked(null);
  }, [q?.id]);

  const progressText = useMemo(() => {
    return `${idx + 1} / ${questions.length}`;
  }, [idx, questions.length]);

  const built = useMemo(() => picked.join(" ").replace(/\s+/g, " ").trim(), [picked]);

  const onPick = (token: string, bankIndex: number) => {
    setChecked(null);
    setBank((prev) => prev.filter((_, i) => i !== bankIndex));
    setPicked((prev) => [...prev, token]);
  };

  const onUnpick = (token: string, pickedIndex: number) => {
    setChecked(null);
    setPicked((prev) => prev.filter((_, i) => i !== pickedIndex));
    setBank((prev) => [...prev, token]);
  };

  const onReset = () => {
    setChecked(null);
    setPicked([]);
    setBank(q.tokens);
  };

  const onCheck = () => {
    const ok = normalize(built) === normalize(q.answer);
    setChecked(
      ok
        ? { ok: true, msg: "정답!" }
        : { ok: false, msg: "오답. 다시 조합해봐." }
    );
  };

  const onNext = () => {
    if (idx >= questions.length - 1) {
      router.push(`/${locale}/student`);
      return;
    }
    setIdx((v) => v + 1);
  };

  if (!q) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-sky-100 via-blue-50 to-indigo-100 p-6">
        <div className="mx-auto max-w-[520px] rounded-[28px] bg-white/60 backdrop-blur-xl border border-white/40 p-6 shadow-[0_8px_32px_rgba(0,100,200,0.12)]">
          문항이 없습니다.
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-100 via-blue-50 to-indigo-100 p-5 md:p-6 lg:p-8">
      {/* 모바일: max-w-[560px], 태블릿: max-w-xl, PC: max-w-2xl */}
      <div className="mx-auto w-full max-w-[560px] md:max-w-xl lg:max-w-2xl space-y-4 md:space-y-6">
        {/* 상단 바: 글래스모피즘 블루 */}
        <div className="rounded-[18px] bg-gradient-to-r from-sky-500 to-blue-600 px-3 py-3 shadow-lg shadow-sky-500/25 backdrop-blur-sm md:px-5 md:py-4">
          <div className="flex items-center justify-between gap-3">
            <button
              onClick={() => router.back()}
              className="flex items-center gap-1 rounded-xl px-2 py-1 text-base md:text-lg font-semibold text-white/95 hover:bg-white/15 transition"
            >
              <span aria-hidden>←</span>
              <span>뒤로</span>
            </button>

            <div className="text-[20px] md:text-[24px] lg:text-[28px] font-bold tracking-tight flex items-center gap-2">
              <span className="text-xl md:text-2xl text-white">👇 문장 배열 훈련</span>
            </div>

            <div className="rounded-full bg-white/20 backdrop-blur-sm px-4 py-2 text-sm md:text-base font-semibold text-white">
              {idx + 1}/{questions.length}
            </div>
          </div>
        </div>

        {/* 문제 카드: 글래스모피즘 */}
        <div className="rounded-[28px] bg-white/60 backdrop-blur-xl border border-white/40 p-5 md:p-8 lg:p-10 shadow-[0_8px_32px_rgba(0,100,200,0.12)]">
          <div className="mb-3 text-base md:text-lg font-bold text-slate-700">상황</div>
          <div className="rounded-2xl border border-sky-200/60 bg-sky-50/50 backdrop-blur-sm p-4 text-[15px] md:text-[17px] lg:text-[18px] font-semibold text-slate-700">
            {q.prompt}
          </div>

          {/* 정답칸 */}
          <div className="mt-5 md:mt-6">
            <div className="mb-2 text-sm md:text-base font-bold text-slate-700">문장 만들기</div>

            <div className="min-h-[64px] md:min-h-[80px] rounded-2xl border-2 border-sky-200/60 bg-white/70 backdrop-blur-sm p-3 md:p-4">
              {picked.length === 0 ? (
                <div className="text-sm font-medium text-sky-400">
                  아래 단어들을 선택하여 문장을 완성하시오.
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {picked.map((t, i) => (
                    <button
                      key={`${t}-${i}`}
                      onClick={() => onUnpick(t, i)}
                      className="rounded-xl bg-sky-100 px-3 py-2 text-sm font-bold text-sky-700 hover:bg-sky-200 transition"
                    >
                      {t}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* 버튼들 */}
            <div className="mt-3 flex gap-2 md:gap-4 md:mt-5">
              <button
                onClick={onReset}
                className="flex-1 rounded-2xl border border-sky-200/60 bg-white/70 backdrop-blur-sm px-4 py-3 md:py-4 text-sm md:text-base lg:text-lg font-extrabold text-sky-600 hover:bg-sky-50 transition"
              >
                초기화
              </button>

              <button
                onClick={onCheck}
                className="flex-1 rounded-2xl bg-gradient-to-r from-sky-500 to-blue-600 px-4 py-3 md:py-4 text-sm md:text-base lg:text-lg font-extrabold text-white shadow-lg shadow-sky-500/30 hover:from-sky-600 hover:to-blue-700 transition active:scale-[0.98]"
              >
                채점
              </button>
            </div>

            {/* 안내 문구: 버튼 아래 */}
            <div className="mt-3 text-center text-sm font-semibold text-sky-600">
              단어를 바르게 배열하여 문장을 완성하시오.
            </div>

            {/* 결과 */}
            {checked && (
              <div
                className={[
                  "mt-3 rounded-2xl border p-4 text-sm font-extrabold backdrop-blur-sm",
                  checked.ok
                    ? "border-green-300/60 bg-green-50/80 text-green-800"
                    : "border-red-300/60 bg-red-50/80 text-red-800",
                ].join(" ")}
              >
                <div>{checked.msg}</div>

                {!checked.ok && (
                  <div className="mt-2 text-xs font-semibold text-slate-600">
                    현재 답: <span className="font-extrabold">{built || "(비어있음)"}</span>
                  </div>
                )}

                {checked.ok && (
                  <button
                    onClick={onNext}
                    className="mt-3 w-full rounded-2xl bg-gradient-to-r from-sky-500 to-blue-600 px-4 py-3 text-sm font-extrabold text-white shadow-lg shadow-sky-500/30 hover:from-sky-600 hover:to-blue-700 transition active:scale-[0.98]"
                  >
                    {idx >= questions.length - 1 ? "끝내기 (홈으로)" : "다음 문제"}
                  </button>
                )}
              </div>
            )}
          </div>

          {/* 단어 뱅크 */}
          <div className="mt-6">
            <div className="rounded-2xl border border-sky-200/60 bg-sky-50/50 backdrop-blur-sm p-3">
              <div className="flex flex-wrap gap-2">
                {bank.map((t, i) => (
                  <button
                    key={`${t}-${i}`}
                    onClick={() => onPick(t, i)}
                    className="rounded-xl bg-white/80 backdrop-blur-sm px-3 py-2 text-sm font-extrabold text-slate-700 shadow-sm ring-1 ring-sky-200/60 hover:bg-white hover:ring-sky-300 transition"
                  >
                    {t}
                  </button>
                ))}
              </div>

              {bank.length === 0 && (
                <div className="text-sm font-semibold text-sky-400">
                  모두 선택했어. 채점 눌러!
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 정답은 채점 후에만 표시 */}
        {checked && (
          <div className="rounded-[28px] bg-white/50 backdrop-blur-xl border border-white/40 p-4 text-xs font-semibold text-slate-500">
            <div className="mb-1">정답(기준): {q.answer}</div>
          </div>
        )}
      </div>
    </div>
  );
}
