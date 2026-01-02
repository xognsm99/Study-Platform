// src/app/api/schools/route.ts
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type NeisSchoolRow = {
  ATPT_OFCDC_SC_CODE: string; // 교육청 코드
  ATPT_OFCDC_SC_NM: string;
  SD_SCHUL_CODE: string; // 표준학교코드
  SCHUL_NM: string;
  ENG_SCHUL_NM?: string;
  SCHUL_KND_SC_NM?: string; // 학교급
  LCTN_SC_NM?: string; // 소재지
  ORG_RDNMA?: string; // 도로명주소
  ORG_TELNO?: string; // 전화
  HOMEPG_ADRES?: string; // 홈페이지
};

// ✅ 시도교육청 코드(NEIS에서 사용)
// (B10 서울, C10 부산, ... )
const OFFICE_CODE: Record<string, string> = {
  "서울": "B10",
  "부산": "C10",
  "대구": "D10",
  "인천": "E10",
  "광주": "F10",
  "대전": "G10",
  "울산": "H10",
  "세종": "I10",
  "경기": "J10",
  "강원": "K10",
  "충북": "M10",
  "충남": "N10",
  "전북": "P10",
  "전남": "Q10",
  "경북": "R10",
  "경남": "S10",
  "제주": "T10",
};

function normalize(s: string) {
  return (s || "").trim();
}

/**
 * region / gu(세부지역)로 어떤 교육청 코드를 조회할지 결정
 * - region = "경기", gu="인천"  => 인천(E10)
 * - region = "경상", gu="부산"  => 부산(C10)
 * - region = "경상", gu="경상북도" => 경북(R10)
 * - region = "경상", gu="전체"  => (경북/경남/부산/울산) 전체 조회
 */
function resolveOfficeCodes(region?: string | null, gu?: string | null): string[] {
  const r = normalize(region || "");
  const g = normalize(gu || "");

  // region이 이미 "서울/경기/인천/..."처럼 들어오는 케이스
  // (UI에서 region 셀렉트 값이 "서울", "전라" 같은 축약일 수 있어, 아래에서 처리)

  // ---- 특수 그룹 처리 ----

  if (r === "경상") {
    if (!g || g === "전체") return ["R10", "S10", "C10", "H10"]; // 경북/경남/부산/울산
    if (g.includes("경상북") || g === "경북") return ["R10"];
    if (g.includes("경상남") || g === "경남") return ["S10"];
    if (g.includes("부산") || g === "부산광역시") return ["C10"];
    if (g.includes("울산") || g === "울산광역시") return ["H10"];
  }

  if (r === "전라") {
    if (!g || g === "전체") return ["P10", "Q10"]; // 전북/전남
    if (g.includes("전라북") || g === "전북") return ["P10"];
    if (g.includes("전라남") || g === "전남") return ["Q10"];
    if (g.includes("광주") || g === "광주광역시") return ["F10"];
  }

  if (r === "충청") {
    if (!g || g === "전체") return ["M10", "N10", "G10", "I10"]; // 충북/충남 + 대전 + 세종(원하면)
    if (g.includes("충청북") || g === "충북") return ["M10"];
    if (g.includes("충청남") || g === "충남") return ["N10"];
    if (g.includes("대전") || g === "대전광역시") return ["G10"];
    if (g.includes("세종") || g === "세종특별자치시") return ["I10"];
  }

  if (r === "경기") {
    // 대표님 요구: 경기 그룹에 인천 포함
    if (!g || g === "전체") return ["J10", "E10"];
    if (g.includes("인천")) return ["E10"];
    return ["J10"];
  }

  if (r === "서울") return ["B10"];

  // region이 "강원/제주/인천..." 등 직접 값이면 매핑
  if (OFFICE_CODE[r]) return [OFFICE_CODE[r]];

  // gu가 직접 "인천/부산"처럼 들어오는 케이스도 커버
  if (OFFICE_CODE[g]) return [OFFICE_CODE[g]];

  // 필터 없으면 전체(너무 무거워서 제한)
  // => 기본은 경기/서울만이라도 하지 말고, "필터 없음"은 빈 배열로 처리해서 호출 자체를 막자.
  return [];
}

// 간단 캐시(서버 메모리) - 같은 검색어 반복 호출 방지
const cache = new Map<string, { at: number; data: any }>();
const TTL_MS = 60_000 * 5; // 5분

async function fetchNeisSchools(params: {
  key: string;
  query: string;
  officeCode: string;
  page?: number;
  size?: number;
}) {
  const { key, query, officeCode } = params;
  const pIndex = params.page ?? 1;
  const pSize = Math.min(params.size ?? 50, 100); // 기본 50, 최대 100으로 제한

  const url = new URL("https://open.neis.go.kr/hub/schoolInfo");
  url.searchParams.set("KEY", key);
  url.searchParams.set("Type", "json");
  url.searchParams.set("pIndex", String(pIndex));
  url.searchParams.set("pSize", String(pSize));
  url.searchParams.set("ATPT_OFCDC_SC_CODE", officeCode);
  url.searchParams.set("SCHUL_NM", query);

  const res = await fetch(url.toString(), { cache: "no-store" });
  if (!res.ok) throw new Error(`NEIS HTTP ${res.status}`);

  const json = await res.json();

  // INFO-200 (데이터 없음) 같은 케이스 방어
  const root = json?.schoolInfo;
  if (!Array.isArray(root) || root.length < 2) return [] as NeisSchoolRow[];
  const rows = root?.[1]?.row;
  if (!Array.isArray(rows)) return [] as NeisSchoolRow[];
  return rows as NeisSchoolRow[];
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    const query = normalize(searchParams.get("query") || "");
    const region = searchParams.get("region");
    const gu = searchParams.get("gu");
    const schoolType = searchParams.get("schoolType") ?? "middle"; // 기본값 middle

    if (query.length < 2) {
      return NextResponse.json({ items: [] });
    }

    const key = process.env.NEIS_API_KEY;
    if (!key) {
      return NextResponse.json(
        { error: "NEIS_API_KEY env is missing (Vercel Environment Variables 확인)" },
        { status: 500 }
      );
    }

    const officeCodes = resolveOfficeCodes(region, gu);

    // 필터가 없으면 호출 자체를 막아서 트래픽 폭발 방지
    if (officeCodes.length === 0) {
      return NextResponse.json({
        items: [],
        note: "region/gu 필터가 없어 NEIS 호출을 생략했습니다.",
      });
    }

    const cacheKey = `${query}|${region || ""}|${gu || ""}|${schoolType}|${officeCodes.join(",")}`;
    const hit = cache.get(cacheKey);
    if (hit && Date.now() - hit.at < TTL_MS) {
      return NextResponse.json(hit.data);
    }

    const results = await Promise.all(
      officeCodes.map(async (code) => {
        try {
          return await fetchNeisSchools({ key, query, officeCode: code, size: 50 });
        } catch {
          return [] as NeisSchoolRow[];
        }
      })
    );

    // 합치고 중복 제거
    const map = new Map<string, NeisSchoolRow>();
    for (const rows of results) {
      for (const r of rows) {
        if (!r?.SD_SCHUL_CODE) continue;
        map.set(r.SD_SCHUL_CODE, r);
      }
    }

    // schoolType이 "middle"이면 중학교만 필터링
    let filteredRows = Array.from(map.values());
    if (schoolType === "middle") {
      filteredRows = filteredRows.filter((r) => r.SCHUL_KND_SC_NM === "중학교");
    }

    const items = filteredRows
      .map((r) => ({
        name: r.SCHUL_NM,
        schoolCode: r.SD_SCHUL_CODE,
        officeCode: r.ATPT_OFCDC_SC_CODE,
        officeName: r.ATPT_OFCDC_SC_NM,
        kind: r.SCHUL_KND_SC_NM || "",
        location: r.LCTN_SC_NM || "",
        address: r.ORG_RDNMA || "",
        tel: r.ORG_TELNO || "",
        homepage: r.HOMEPG_ADRES || "",
      }))
      // 검색어와 앞부분이 잘 맞는 학교 먼저
      .sort((a, b) => {
        const aStarts = a.name.startsWith(query) ? 0 : 1;
        const bStarts = b.name.startsWith(query) ? 0 : 1;
        if (aStarts !== bStarts) return aStarts - bStarts;
        return a.name.localeCompare(b.name, "ko");
      })
      .slice(0, 30);

    const payload = { items };

    cache.set(cacheKey, { at: Date.now(), data: payload });

    return NextResponse.json(payload);
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || "unknown error" },
      { status: 500 }
    );
  }
}
