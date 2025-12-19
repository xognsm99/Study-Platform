"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type SchoolItem = {
  name: string;
  schoolCode: string;
  officeCode: string;
  officeName: string;
  kind: string;
  location: string;
  address: string;
};

export default function SchoolSearch(props: {
  region: string; // 예: "경기", "서울", "전라", "경상" ...
  gu: string;     // 예: "인천", "강남구", "경상북도", "전체" ...
  onSelect: (school: { name: string; schoolCode: string; officeCode: string }) => void;
}) {
  const { region, gu, onSelect } = props;

  const [q, setQ] = useState("");
  const [items, setItems] = useState<SchoolItem[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const abortRef = useRef<AbortController | null>(null);

  const canSearch = q.trim().length >= 2;

  useEffect(() => {
    if (!canSearch) {
      setItems([]);
      setOpen(false);
      setMsg(null);
      return;
    }

    setLoading(true);
    setMsg(null);

    const t = setTimeout(async () => {
      abortRef.current?.abort();
      const ac = new AbortController();
      abortRef.current = ac;

      try {
        const url = new URL("/api/schools", window.location.origin);
        url.searchParams.set("query", q.trim());
        url.searchParams.set("region", region || "");
        url.searchParams.set("gu", gu || "");
        url.searchParams.set("schoolType", "middle");

        const res = await fetch(url.toString(), { signal: ac.signal });
        const data = await res.json();

        if (!res.ok) {
          setItems([]);
          setOpen(true);
          setMsg(data?.error || "학교 검색 API 오류");
          return;
        }

        const list = Array.isArray(data?.items) ? (data.items as SchoolItem[]) : [];
        setItems(list);
        setOpen(true);
        if (list.length === 0) setMsg(`검색 결과 없음: ${q.trim()}`);
      } catch (e: any) {
        if (e?.name === "AbortError") return;
        setItems([]);
        setOpen(true);
        setMsg("검색 중 오류");
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => clearTimeout(t);
  }, [q, region, gu, canSearch]);

  return (
    <div className="w-full">
      <div className="flex w-full gap-2">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="학교 이름 2글자 이상 입력 (예: 대동, 신어)"
          className={
            "h-12 flex-1 w-full rounded-xl border border-gray-200 px-4 text-sm outline-none " +
            "bg-white text-gray-900 placeholder:text-gray-400 " +
            "focus:ring-4 focus:ring-blue-200 " +
            "dark:border-teal-600 dark:bg-teal-600 dark:text-white dark:placeholder:text-white/70"
          }
        />
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="h-12 w-[96px] shrink-0 rounded-xl border border-gray-200 bg-white text-sm font-semibold text-gray-900 shadow-sm
                     hover:border-blue-500 hover:text-blue-600
                     dark:border-teal-600 dark:bg-teal-600 dark:text-white dark:hover:bg-teal-700"
        >
          {loading ? "검색중" : "검색"}
        </button>
      </div>

      <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
        검색 결과에서 선택하면 위 &quot;학교&quot; 칸에 적용됩니다.
      </p>

      {open && (items.length > 0 || msg) && (
        <div className="mt-2 rounded-xl border border-gray-200 bg-white p-2 shadow-sm dark:border-teal-600 dark:bg-teal-700/90">
          {msg && (
            <div className="p-2 text-sm text-gray-600 dark:text-white">
              {msg}
              {region || gu ? (
                <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  지역/필터 때문에 비어있을 수 있어요.
                </div>
              ) : null}
            </div>
          )}

          {items.map((it) => (
            <button
              key={`${it.officeCode}-${it.schoolCode}`}
              type="button"
              onClick={() => {
                onSelect({ name: it.name, schoolCode: it.schoolCode, officeCode: it.officeCode });
                setOpen(false);
              }}
              className="w-full rounded-lg px-3 py-2 text-left hover:bg-gray-50 dark:hover:bg-teal-800"
            >
              <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                {it.name}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                {it.location} · {it.kind} · {it.officeName}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
