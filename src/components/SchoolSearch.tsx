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
      <div className="grid grid-cols-[1fr_auto] gap-3 max-[380px]:gap-2">
        <input
          id="schoolSearchInput"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="학교 검색 2글자 이상"
          className="h-12 w-full min-w-0 rounded-full border border-[#E7E5FF] bg-white px-4 text-sm max-[380px]:h-10 max-[380px]:text-xs text-slate-900 outline-none transition focus:border-[#B9B4E4] focus:ring-2 focus:ring-[#B9B4E4]/30 placeholder:text-[#C9C6F2]"
        />
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="h-12 w-24 shrink-0 rounded-full bg-[#6E63D5] hover:bg-[#5B52C8] text-lg max-[380px]:h-10 max-[380px]:w-20 max-[380px]:text-xs font-semibold text-white shadow-md active:scale-[0.99] transition-all"
        >
          {loading ? "검색중" : "검색"}
        </button>
      </div>

      <p className="mt-2 text-xs text-gray-400 max-[380px]:text-[11px]">
        검색 결과에서 선택하면 위 &quot;학교&quot; 칸에 적용됩니다.
      </p>

      {open && (items.length > 0 || msg) && (
        <div
          className="
            mt-3 overflow-hidden rounded-2xl
            bg-[#F6F5FF] border border-[#E6E2FF]
            shadow-[0_18px_60px_rgba(110,99,213,0.18)]
          "
        >
          {msg && (
            <div className="px-4 py-3 text-sm text-[#6E63D5]/80">
              {msg}
              {region || gu ? (
                <div className="mt-1 text-xs text-[#6E63D5]/60">
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
              className="
                w-full text-left px-4 py-3
                hover:bg-[#EEEAFE] active:bg-[#E6E2FF]
                transition
              "
            >
              <div className="text-[#2B235A] font-semibold">
                {it.name}
              </div>
              <div className="text-[#6E63D5]/80 text-xs mt-1">
                {it.location} · {it.kind} · {it.officeName}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
