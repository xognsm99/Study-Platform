"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type Blank = {
  id: string;
  options: [string, string];
  answerIndex: 0 | 1;
};

type Segment =
  | { kind: "text"; value: string }
  | { kind: "blank"; value: Blank };

type QuizPage = {
  title: string;
  lines: Segment[][];
};

type QuizPassage = {
  title: string;
  lines: Segment[][];
};

function t(value: string): Segment {
  return { kind: "text", value };
}
function b(
  id: string,
  options: [string, string],
  answerIndex: 0 | 1
): Segment {
  return { kind: "blank", value: { id, options, answerIndex } };
}

// 페이지 자동 분할 헬퍼
function chunkLines(lines: Segment[][], maxLinesPerPage: number): Segment[][][] {
  const chunks: Segment[][][] = [];
  for (let i = 0; i < lines.length; i += maxLinesPerPage) {
    chunks.push(lines.slice(i, i + maxLinesPerPage));
  }
  return chunks;
}

export default function ReadingABPage() {
  const router = useRouter();
  const MAX_LINES_PER_PAGE = 5; // iPhone SE 기준, 필요시 4로 조정 가능

  // ✅ PDF 본문 기반(고정 문제, 셔플 없음)
  const passages: QuizPassage[] = useMemo(
    () => [
      {
        title: "본문 선택",
        lines: [
          [t("Hello! I’m Somin.")],
          [
            t("I’m 15 "),
            b("p1_q1", ["year", "years"], 1),
            t(" old, and I live "),
            b("p1_q2", ["in", "at"], 0),
            t(" Korea."),
          ],
          [
            t("Please tell "),
            b("p1_q3", ["to me", "me"], 1),
            t(" about your favorite time "),
            b("p1_q4", ["of", "for"], 0),
            t(" the day."),
          ],
          [
            t("You can "),
            b("p1_q5", ["also", "too"], 0),
            t(" show "),
            b("p1_q6", ["me", "to me"], 0),
            t(" some pictures."),
          ],
        ],
      },
      {
        title: "본문 선택",
        lines: [
          [
            t("Hi, my name is Diego, and I live "),
            b("p2_q1", ["in", "at"], 0),
            t(" "),
            b("p2_q2", ["Seville, Spain", "Spain, Seville"], 0),
            t("."),
          ],
          [
            t("My favorite time "),
            b("p2_q3", ["of", "for"], 0),
            t(" the day "),
            b("p2_q4", ["is", "are"], 0),
            t(" lunch time."),
          ],
          [
            t("My school "),
            b("p2_q5", ["usually ends", "ends usually"], 0),
            t(" "),
            b("p2_q6", ["about", "around"], 1),
            t(" 2 p.m."),
          ],
          [
            b("p2_q7", ["On", "In"], 0),
            t(" most days, my family "),
            b("p2_q8", ["get", "gets"], 1),
            t(" together and "),
            b("p2_q9", ["have", "has"], 0),
            t(" a big, long lunch."),
          ],
          [
            t("We "),
            b("p2_q10", ["usually have", "have usually"], 0),
            t(" soup, vegetables, "),
            b("p2_q11", ["and", "or"], 0),
            t(" meat."),
          ],
          [
            t("We "),
            b("p2_q12", ["also", "too"], 0),
            t(" have a dessert like churros."),
          ],
          [
            t("After lunch, we "),
            b("p2_q13", ["take usually", "usually take"], 1),
            t(" a siesta, a short nap."),
          ],
          [
            t("Both my father "),
            b("p2_q14", ["and", "or"], 0),
            t(" I like "),
            b("p2_q15", ["to sleeping", "to sleep"], 1),
            t(" under the tree in our garden."),
          ],
        ],
      },
      {
        title: "본문 선택",
        lines: [
          [
            t("Hi! My name is Tabin, and I live "),
            b("p3_q1", ["near", "nearly"], 0),
            t(" the Gobi Desert "),
            b("p3_q2", ["in", "at"], 0),
            t(" Mongolia."),
          ],
          [t("I’m happy "), b("p3_q3", ["when", "while"], 0), t(" I ride my horse.")],
          [t("Horses are important "), b("p3_q4", ["in", "at"], 0), t(" our culture.")],
          [
            b("p3_q5", ["Almost", "Always"], 0),
            t(" everyone can ride a horse "),
            b("p3_q6", ["in", "at"], 0),
            t(" Mongolia."),
          ],
          [
            b("p3_q7", ["On", "In"], 1),
            t(' fact, we say, "We ride horses before we can '),
            b("p3_q8", ["to walk", "walk"], 1),
            t('."'),
          ],
          [
            t("I take good care "),
            b("p3_q9", ["of", "for"], 0),
            t(" my horse."),
          ],
          [
            t("I "),
            b("p3_q10", ["often brush", "brush often"], 0),
            t(" him and give "),
            b("p3_q11", ["some carrot him", "him some carrots"], 1),
            t("."),
          ],
          [
            t("I enjoy "),
            b("p3_q12", ["to ride", "riding"], 1),
            t(" especially "),
            b("p3_q13", ["in", "at"], 0),
            t(" the evening before the sunset."),
          ],
          [
            b("p3_q14", ["Then", "Than"], 0),
            t(" "),
            b("p3_q15", ["sky", "the sky"], 1),
            t(" is red, and everything "),
            b("p3_q16", ["is", "are"], 0),
            t(" "),
            b("p3_q17", ["peace", "peaceful"], 1),
            t("."),
          ],
        ],
      },
      {
        title: "본문 선택",
        lines: [
          [
            t("Hi! I’m Musa, and I live "),
            b("p4_q1", ["in", "at"], 0),
            t(" "),
            b("p4_q2", ["Nairobi, Kenya", "Kenya Nairobi"], 0),
            t("."),
          ],
          [
            t("My favorite time "),
            b("p4_q3", ["of", "for"], 0),
            t(" the day is our "),
            b("p4_q4", ["running", "runing"], 0),
            t(" practice time."),
          ],
          [
            t("My friend, Tamu, and I "),
            b("p4_q5", ["am", "are"], 1),
            t(" "),
            b("p4_q6", ["in", "on"], 1),
            t(" the school’s "),
            b("p4_q7", ["runing", "running"], 1),
            t(" team."),
          ],
          [
            t("I’m "),
            b("p4_q8", ["happiest", "most happy"], 0),
            t(" when I run "),
            b("p4_q9", ["with", "by"], 0),
            t(" Tamu."),
          ],
          [
            t("Our practice time isn’t "),
            b("p4_q10", ["boring", "bored"], 0),
            t(" "),
            b("p4_q11", ["because of", "because"], 1),
            t(" we can see many animals."),
          ],
          [
            t("Many runners "),
            b("p4_q12", ["from", "in"], 0),
            t(" Kenya won races "),
            b("p4_q13", ["in", "on"], 0),
            t(" the Olympics."),
          ],
          [t("I’m so proud "), b("p4_q14", ["of", "with"], 0), t(" them.")],
          [
            b("p4_q15", ["Both", "Either"], 0),
            t(" Tamu "),
            b("p4_q16", ["and", "or"], 0),
            t(" I want "),
            b("p4_q17", ["to be", "being"], 0),
            t(" like them."),
          ],
        ],
      },
    ],
    []
  );

  // passages를 MAX_LINES_PER_PAGE 기준으로 분할해서 pages 생성
  const pages: QuizPage[] = useMemo(() => {
    const result: QuizPage[] = [];
    for (const passage of passages) {
      const chunks = chunkLines(passage.lines, MAX_LINES_PER_PAGE);
      if (chunks.length === 1) {
        result.push({ title: passage.title, lines: chunks[0] });
      } else {
        chunks.forEach((chunk, idx) => {
          result.push({ title: `${passage.title}-${idx + 1}`, lines: chunk });
        });
      }
    }
    return result;
  }, [passages, MAX_LINES_PER_PAGE]);

  const [pageIndex, setPageIndex] = useState(0);
  const [checked, setChecked] = useState(false);
  const [answers, setAnswers] = useState<Record<string, 0 | 1>>({});

  const page = pages[pageIndex];

  const blanksOnPage = useMemo(() => {
    const arr: Blank[] = [];
    for (const line of page.lines) {
      for (const seg of line) {
        if (seg.kind === "blank") arr.push(seg.value);
      }
    }
    return arr;
  }, [page]);

  const allAnswered = blanksOnPage.every((q) => answers[q.id] === 0 || answers[q.id] === 1);

  const goNext = () => {
    if (pageIndex >= pages.length - 1) {
      router.back();
      return;
    }
    setPageIndex((p) => p + 1);
    setChecked(false);
    setAnswers({});
  };

  return (
    <div className="min-h-screen bg-[#F5F3FF] px-4 py-6">

      <div className="mx-auto w-full max-w-[420px]">
        {/* 헤더 */}
        <div className="mb-4 flex items-center justify-between text-[#6E63D5]">
          <button onClick={() => router.back()} className="text-[#2B245A]/80">
            ← 뒤로가기
          </button>
          <div className="text-xl font-semibold">본문 선택형 훈련</div>
          <div className="w-[80px]" />
        </div>

        {/* 카드(스크롤 없이 보이도록 설계: 페이지를 짧게 쪼개서 보여줌) */}
        <div className="rounded-[28px] bg-white/95 p-5 shadow-[0_18px_60px_rgba(22,16,60,0.18)]">
          <div className="mb-3 flex items-center justify-between">
            <div className="text-[#2B245Z] font-xs text-[14px]">{page.title}</div>
            <div className="text-xs text-slate-500">
              {pageIndex + 1} / {pages.length}
            </div>
          </div>

          <div className="space-y-3">
            {page.lines.map((line, li) => (
              <p key={li} className="text-[14px] leading-6 text-slate-900">
                {line.map((seg, si) => {
                  if (seg.kind === "text") return <span key={si}>{seg.value}</span>;
                  return (
                    <ChoiceBlank
                      key={seg.value.id}
                      blank={seg.value}
                      value={answers[seg.value.id]}
                      onChange={(v) => {
                        if (checked) return; // ✅ 검사 후에는 고정
                        setAnswers((prev) => {
                          const next = { ...prev };
                          next[seg.value.id] = v;
                          return next;
                        });
                      }}
                      checked={checked}
                    />
                  );
                })}
              </p>
            ))}
          </div>

          {/* 하단 버튼: “전부 선택 끝나야” 검사 가능, 검사 후 다음 */}
          <button
            onClick={() => {
              if (!allAnswered) return;
              if (!checked) setChecked(true);
              else goNext();
            }}
            disabled={!allAnswered}
            className={[
              "mt-6 w-full rounded-full py-4 font-semibold transition",
              !allAnswered
                ? "bg-[#B9B4E4] text-[#2B245A]/50 cursor-not-allowed"
                : checked
                ? "bg-[#6E63D5] text-white hover:bg-[#584FAA] active:bg-[#4D4595]"
                : "bg-[#6E63D5] text-white hover:bg-[#584FAA] active:bg-[#4D4595]",
            ].join(" ")}
          >
            {!checked ? "정답 보기" : pageIndex === pages.length - 1 ? "완료" : "다음 단락 →"}
          </button>

          {!allAnswered && (
            <p className="mt-3 text-xs text-slate-500">
              모든 (보기) 를 선택하면 검사할 수 있어요.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function ChoiceBlank({
  blank,
  value,
  onChange,
  checked,
}: {
  blank: Blank;
  value?: 0 | 1;
  onChange: (v: 0 | 1) => void;
  checked: boolean;
}) {
  const selected = value;
  const correct = blank.answerIndex;

  const showCheckOnOption = (optIndex: 0 | 1) => checked && optIndex === correct;
  const showXOnOption = (optIndex: 0 | 1) =>
    checked && selected !== undefined && selected !== correct && optIndex === selected;

  return (
    <span className="inline-flex items-center mx-1">
      <span className="inline-flex items-center gap-1 rounded-lg border-2 border-[#D9D5F6] bg-[#F3F1FF] px-2 py-1">
        {[0, 1].map((i) => {
          const optIndex = i as 0 | 1;
          const isSelected = value === optIndex;

          return (
            <button
              key={optIndex}
              type="button"
              onClick={() => !checked && onChange(optIndex)}
              className={[
                "inline-flex items-center gap-1 rounded-md px-2 py-[3px] text-[13px] leading-none",
                isSelected
                  ? "bg-[#6E63D5] text-white font-bold border-2 border-[#6E63D5] shadow-sm"
                  : "bg-white/60 text-[#2B245A]/70 border-2 border-transparent",
                checked ? "cursor-default" : "",
              ].join(" ")}
            >
              <span>{blank.options[optIndex]}</span>

              {showCheckOnOption(optIndex) && (
                <span className="ml-1 inline-flex h-4 w-4 items-center justify-center rounded-full bg-green-200 text-green-800 text-[11px]">
                  ✓
                </span>
              )}
              {showXOnOption(optIndex) && (
                <span className="ml-1 inline-flex h-4 w-4 items-center justify-center rounded-full bg-red-200 text-red-800 text-[11px]">
                  ✕
                </span>
              )}
            </button>
          );
        })}
      </span>
    </span>
  );
}
