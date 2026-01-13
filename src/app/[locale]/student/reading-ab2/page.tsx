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
      <div className="min-h-screen bg-sky-50 p-6">
        <div className="mx-auto max-w-[520px] rounded-[28px] bg-white/90 p-6 shadow">
          문항이 없습니다.
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-sky-50 p-5">
      <div className="mx-auto w-full max-w-[560px] space-y-4">
        {/* 상단 바: 블루 톤 */}
        <div className="rounded-[18px] bg-gradient-to-r from-[#1e40af] to-[#2563eb] px-2 py-3 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <button
              onClick={() => router.back()}
              className="flex items-center gap-1 rounded-xl px-1 py-1 text-base font-semibold text-white/95 hover:bg-white/10"
            >
              <span aria-hidden>←</span>
              <span>뒤로</span>
            </button>

            <div className="text-[20px] font-bold tracking-tight flex items-center gap-2">
            <span className="text-xl text-white">👇문장 배열 훈련</span>
              <span className="text-[20px] font-bold"></span>
            </div>

            <div className="rounded-full bg-white/20 px-4 py-2 text-sm font-semibold text-white">
              {idx + 1}/{questions.length}
            </div>
          </div>
        </div>

        {/* 문제 카드 */}
        <div className="rounded-[28px] bg-white/90 p-5 shadow-sm">
          <div className="mb-3 text-base font-bold text-[#2E2A55]">상황</div>
          <div className="rounded-2xl border border-[#E6E3FA] bg-[#FBFAFF] p-4 text-[15px] font-semibold text-[#2E2A55]">
            {q.prompt}
          </div>

          {/* 정답칸 */}
          <div className="mt-5">
            <div className="mb-2 text-sm font-bold text-[#2E2A55]">문장 만들기</div>

            <div className="min-h-[64px] rounded-2xl border-2 border-[#E6E3FA] bg-white p-3">
              {picked.length === 0 ? (
                <div className="text-sm font-medium text-[#8F8AAE]">
                  아래 단어들을 선택하여 문장을 완성하시오.
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {picked.map((t, i) => (
                    <button
                      key={`${t}-${i}`}
                      onClick={() => onUnpick(t, i)}
                      className="rounded-xl bg-[#E9E6FF] px-3 py-2 text-sm font-bold text-[#4E43C8] hover:bg-[#DCD7FF]"
                    >
                      {t}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* 버튼들 */}
            <div className="mt-3 flex gap-2">
              <button
                onClick={onReset}
                className="flex-1 rounded-2xl border border-[#E6E3FA] bg-white px-4 py-3 text-sm font-extrabold text-[#4E43C8] hover:bg-[#F3F1FF]"
              >
                초기화
              </button>

              <button
                onClick={onCheck}
                className="flex-1 rounded-2xl bg-[#6E63D5] px-4 py-3 text-sm font-extrabold text-white shadow hover:opacity-95"
              >
                채점
              </button>
            </div>

            {/* 안내 문구: 버튼 아래 */}
            <div className="mt-3 text-center text-sm font-semibold text-[#4E43C8]">
              단어를 바르게 배열하여 문장을 완성하시오.
            </div>

            {/* 결과 */}
            {checked && (
              <div
                className={[
                  "mt-3 rounded-2xl border p-4 text-sm font-extrabold",
                  checked.ok
                    ? "border-green-300 bg-green-50 text-green-800"
                    : "border-red-300 bg-red-50 text-red-800",
                ].join(" ")}
              >
                <div>{checked.msg}</div>

                {!checked.ok && (
                  <div className="mt-2 text-xs font-semibold text-[#2E2A55]">
                    현재 답: <span className="font-extrabold">{built || "(비어있음)"}</span>
                  </div>
                )}

                {checked.ok && (
                  <button
                    onClick={onNext}
                    className="mt-3 w-full rounded-2xl bg-[#6E63D5] px-4 py-3 text-sm font-extrabold text-white hover:opacity-95"
                  >
                    {idx >= questions.length - 1 ? "끝내기 (홈으로)" : "다음 문제"}
                  </button>
                )}
              </div>
            )}
          </div>

          {/* 단어 뱅크 */}
          <div className="mt-6">
            <div className="rounded-2xl border border-[#E6E3FA] bg-[#FBFAFF] p-3">
              <div className="flex flex-wrap gap-2">
                {bank.map((t, i) => (
                  <button
                    key={`${t}-${i}`}
                    onClick={() => onPick(t, i)}
                    className="rounded-xl bg-white px-3 py-2 text-sm font-extrabold text-[#2E2A55] shadow-sm ring-1 ring-[#E6E3FA] hover:bg-[#F3F1FF]"
                  >
                    {t}
                  </button>
                ))}
              </div>

              {bank.length === 0 && (
                <div className="text-sm font-semibold text-[#8F8AAE]">
                  모두 선택했어. 채점 눌러!
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 정답은 채점 후에만 표시 */}
        {checked && (
          <div className="rounded-[28px] bg-white/70 p-4 text-xs font-semibold text-[#6A6588]">
            <div className="mb-1">정답(기준): {q.answer}</div>
          </div>
        )}
      </div>
    </div>
  );
}
