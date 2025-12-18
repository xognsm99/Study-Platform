import { NextResponse } from "next/server";

export const runtime = "nodejs";

type Item = {
  code: string; // SD_SCHUL_CODE
  name: string; // SCHUL_NM
  kind?: string; // SCHUL_KND_SC_NM
  location?: string; // LCTN_SC_NM
  officeCode?: string; // ATPT_OFCDC_SC_CODE
  officeName?: string; // ATPT_OFCDC_SC_NM
  address?: string; // 도로명주소
};

const REGION_GROUPS: Record<string, string[]> = {
  "서울": ["서울특별시"],
  "경기": ["경기도"],
  "충청": ["충청북도", "충청남도", "세종특별자치시", "대전광역시"],
  "전라": ["전라북도", "전라남도", "광주광역시"],
  "경상": ["경상북도", "경상남도", "부산광역시", "대구광역시", "울산광역시"],
  "강원": ["강원특별자치도", "강원도"],
  "제주": ["제주특별자치도"],
};

async function fetchSchoolsByLocation(params: {
  key: string;
  q: string;
  location: string;
  size: number;
}) {
  const { key, q, location, size } = params;

  const url = new URL("https://open.neis.go.kr/hub/schoolInfo");
  url.searchParams.set("KEY", key);
  url.searchParams.set("Type", "json");
  url.searchParams.set("pIndex", "1");
  url.searchParams.set("pSize", String(size));
  url.searchParams.set("SCHUL_NM", q);
  url.searchParams.set("LCTN_SC_NM", location);

  const res = await fetch(url.toString(), { cache: "no-store" });
  if (!res.ok) return [];

  const data = await res.json().catch(() => null);
  const rows = data?.schoolInfo?.[1]?.row ?? [];
  if (!Array.isArray(rows)) return [];

  const items: Item[] = rows.map((r: any) => ({
    code: r.SD_SCHUL_CODE,
    name: r.SCHUL_NM,
    kind: r.SCHUL_KND_SC_NM,
    location: r.LCTN_SC_NM,
    officeCode: r.ATPT_OFCDC_SC_CODE,
    officeName: r.ATPT_OFCDC_SC_NM,
    address:
      r.ORG_RDNMA ||
      r.ORG_RDNMA_ADDR ||
      r.ORG_RDNMA?.toString?.() ||
      "",
  }));

  return items.filter((it) => it.code && it.name);
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const group = (searchParams.get("group") ?? "").trim();
  const q = (searchParams.get("q") ?? "").trim();
  const sub = (searchParams.get("sub") ?? "").trim();
  const size = Math.min(Number(searchParams.get("size") ?? 30) || 30, 50);

  // 안전장치: 입력이 너무 짧으면 호출하지 않음
  if (q.length < 2) {
    return NextResponse.json({ items: [], reason: "q_too_short" });
  }

  const key = process.env.NEIS_API_KEY;
  if (!key) {
    // 키 없어도 앱이 죽지 않게 "빈 결과"로 반환
    return NextResponse.json({ items: [], reason: "missing_neis_key" });
  }

  const locations = REGION_GROUPS[group] ?? [];
  if (locations.length === 0) {
    return NextResponse.json({ items: [], reason: "invalid_group" });
  }

  // 지역(복수)별로 조금씩 가져와서 합치기
  const perLoc = Math.max(5, Math.floor(size / locations.length));
  const results = await Promise.all(
    locations.map((loc) =>
      fetchSchoolsByLocation({ key, q, location: loc, size: perLoc })
    )
  );

  const merged = results.flat();

  // 학교코드 기준 중복 제거
  const seen = new Set<string>();
  const uniq: Item[] = [];
  for (const it of merged) {
    if (seen.has(it.code)) continue;
    seen.add(it.code);
    uniq.push(it);
  }

  // 이름 정렬
  uniq.sort((a, b) => a.name.localeCompare(b.name, "ko"));

  // sub(구/시)로 후필터링
  let filtered = uniq;
  if (sub) {
    // 서울: "구" 단위는 주소에 보통 "구"가 포함됨
    // 경기: "시/군"도 주소에 포함됨
    filtered = filtered.filter((it) => (it.address ?? "").includes(sub));
  }

  return NextResponse.json({ items: filtered.slice(0, size) });
}

