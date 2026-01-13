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
        [ t("You can work with NGOs "), b("u1_b1", ["as", "for"], 0), t(" a teenager.") ],
        [ t("It is a great way "), b("u1_b2", ["learning", "to learn"], 1), t(" about social issues and "), b("u1_b3", ["make", "making"], 0), t(" the") ],
        [ t("world better.") ],
        [ t("Are you "), b("u1_b4", ["interesting", "interested"], 1), t("? Then, "), b("u1_b5", ["read", "reading"], 0), t(" Inho’s blog below.") ],
        [ t("JAN 5") ],
        [ t("I grew "), b("u1_b6", ["out", "up"], 1), t(" in Jeju-do, so I had "), b("u1_b7", ["many", "much"], 0), t(" "), b("u1_b8", ["chance", "chances"], 1), t(" to see") ],
        [ t("dolphins.") ],
        [ t("Then, I learned "), b("u1_b9", ["that", "what"], 0), t(" some dolphins are "), b("u1_b10", ["with", "in"], 1), t(" danger.") ],
        [ t("some are even "), b("u1_b11", ["endangering", "endangered"], 1), t(".") ],
        [ t("I thought I "), b("u1_b12", ["would", "should"], 1), t(" do something.") ],
        [ t("So, I searched the Internet and "), b("u1_b13", ["found", "founded"], 0), t(" an NGO, Dolphin Lovers.") ],
        [ t("It "), b("u1_b14", ["does", "did"], 0), t(" "), b("u1_b15", ["various", "variety"], 0), t(" activities "), b("u1_b16", ["such as", "so as"], 0), t(" "), b("u1_b17", ["cleans", "cleaning"], 1), t(" up") ],
        [ t("beaches and "), b("u1_b18", ["helps", "helping"], 1), t(" dolphins.") ],
        [ t("After some thought, I joined "), b("u1_b19", ["it", "them"], 0), t(" today.") ],
        [ t("JAN20") ],
        [ t("Many dolphins get sick or even die "), b("u1_b20", ["because", "because of"], 0), t(" plastic waste and fishing") ],
        [ t("nets, so "), b("u1_b21", ["clean up", "cleaning up"], 1), t(" beaches "), b("u1_b22", ["is", "are"], 0), t(" important.") ],
        [ b("u1_b23", ["It", "There"], 1), t(" was a beach cleanup party today, and I took part in "), b("u1_b24", ["it", "them"], 0), t(".") ],
        [ b("u1_b25", ["Clean up", "Cleaning up"], 1), t(" the beach was not easy, but I enjoyed "), b("u1_b26", ["it", "them"], 0), t(".") ],
        [ t("Oh, I saw Aunt Sumi there. She is also "), b("u1_b27", ["a", "the"], 0), t(" member of Dolphin Lovers.") ],
        [ b("u1_b28", ["What", "How"], 0), t(" a small world~!") ],
        [ t("FEB 14") ],
        [ t("This afternoon, I "), b("u1_b29", ["take", "took"], 1), t(" part in a training class for Halla and Olle, two") ],
        [ t("dolphins in an aquarium in Jeju-do.") ],
        [ t("The "), b("u1_b30", ["late", "latest"], 1), t(" project of Dolphin Lovers "), b("u1_b31", ["is", "are"], 0), t(" to return "), b("u1_b32", ["it", "them"], 1), t(" to the sea.") ],
        [ t("For this, Halla and Olle first need "), b("u1_b33", ["learning", "to learn"], 1), t(" some skills.") ],
        [ t("They will need "), b("u1_b34", ["it", "them"], 1), t(" "), b("u1_b35", ["to survive", "surviving"], 0), t(" in the wild.") ],
        [ t("I really wanted "), b("u1_b36", ["being", "to be"], 1), t(" part of the project.") ],
        [ b("u1_b37", ["Lucky", "Luckily"], 1), t(", I got the chance.") ],
        [ t("I just "), b("u1_b38", ["run", "ran"], 1), t(" some "), b("u1_b39", ["errors", "errands"], 1), t(" in the training class today, but the") ],
        [ t("experience made me so "), b("u1_b40", ["exciting", "excited"], 1), t(".") ],
        [ t("APR22") ],
        [ t("Today, Halla and Olle went back to the sea.") ],
        [ b("u1_b41", ["It", "There"], 1), t(" was a small ceremony, and all the members of Dolphin Lovers were") ],
        [ b("u1_b42", ["here", "there"], 1) ],
        [ t("The ceremony made us quite "), b("u1_b43", ["emotion", "emotional"], 1), t(".") ],
        [ b("u1_b44", ["In fact", "However"], 0), t(", I cried "), b("u1_b45", ["a few", "a little"], 1), t(". Now I cannot see Halla and Olle") ],
        [ b("u1_b46", ["anymore", "no more"], 0), t("!") ],
        [ b("u1_b47", ["However", "Therefore"], 0), t(", I was very happy "), b("u1_b48", ["for", "at"], 1), t(" the same time.") ],
        [ t("After 10 "), b("u1_b49", ["year", "years"], 1), t(" of hard life in an aquarium, now all the sea is "), b("u1_b50", ["its", "their"], 1) ],
        [ t("home.") ],
        [ t("“Live "), b("u1_b51", ["free", "freely"], 1), t(" and "), b("u1_b52", ["happy", "happily"], 1), t(" ever after~!” I shouted and waved goodbye") ],
        [ t("to "), b("u1_b53", ["it", "them"], 1), t(".") ]
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
  const [checkedByPage, setCheckedByPage] = useState<Record<number, boolean>>({});
  const checked = !!checkedByPage[pageIndex];
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
  };

  return (
    <div className="min-h-screen bg-sky-50 dark:bg-sky-50 px-4 py-6">

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
              if (!checked) setCheckedByPage((prev) => ({ ...prev, [pageIndex]: true }));
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
