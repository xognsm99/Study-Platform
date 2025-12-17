import dotenv from "dotenv";
import xlsx from "xlsx";
import { createClient } from "@supabase/supabase-js";
import crypto from "node:crypto";

dotenv.config({ path: ".env.local" });

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("❌ .env.local에 SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY 필요");
  process.exit(1);
}

// 진단 로그: 사용된 SUPABASE_URL 확인 (키는 출력하지 않음)
console.log("SUPABASE_URL_USED =", SUPABASE_URL);

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

const TABLE = "problems";

// 허용된 qtype 목록
const ALLOWED_QTYPES = new Set<string>([
  "어휘_사전",
  "어휘_영영",
  "어휘_문맥",
  "문법_어법오류",
  "문법_빈칸",
  "문법_배열",
  "본문_제목",
  "본문_물음",
  "본문_일치",
  "대화문_빈칸",
  "대화문_흐름",
  "대화문_응답",
]);

// qtype에서 category로 매핑 (prefix 기반, fallback은 vocab)
function categoryFromQtype(qtype: string): string {
  const qt = String(qtype ?? "").trim();
  if (qt.startsWith("어휘_")) return "vocab";
  if (qt.startsWith("문법_")) return "grammar";
  if (qt.startsWith("본문_")) return "reading";
  if (qt.startsWith("대화문_")) return "dialogue";
  return "vocab"; // fallback
}

// ✅ 헤더 정규화 함수: 괄호 제거, 공백 제거, trim
function normalizeHeader(header: string): string {
  if (!header) return "";
  // 괄호 제거: ( ... ) / （ ... ） (한글/영문 괄호 모두)
  let normalized = header.replace(/[（(].*?[）)]/g, "").trim();
  // 공백 제거
  normalized = normalized.replace(/\s+/g, "");
  // 앞뒤 trim
  return normalized.trim();
}

// ✅ 컬럼 aliases 정의
const COLUMN_ALIASES: Record<string, string[]> = {
  보기1: ["보기1", "선택지1", "choice1", "option1", "보기 1", "선택지 1"],
  보기2: ["보기2", "선택지2", "choice2", "option2", "보기 2", "선택지 2"],
  보기3: ["보기3", "선택지3", "choice3", "option3", "보기 3", "선택지 3"],
  보기4: ["보기4", "선택지4", "choice4", "option4", "보기 4", "선택지 4"],
  보기5: ["보기5", "선택지5", "choice5", "option5", "보기 5", "선택지 5"],
  정답번호: ["정답번호", "정답", "answer", "answernumber", "answer_no", "answerNumber"],
  문제: ["문제", "question", "질문"],
  지문: ["지문", "passage", "본문", "지문텍스트"],
  해설: ["해설", "explain", "explanation", "설명"],
  qtype: ["qtype", "소분류", "유형"],
  번호: ["번호", "number", "num", "no"],
};

// ✅ 헤더 맵 생성 (정규화된 헤더 → 컬럼 인덱스)
function createHeaderMap(headers: string[]): Map<string, number> {
  const map = new Map<string, number>();
  headers.forEach((header, index) => {
    const normalized = normalizeHeader(header);
    if (normalized) {
      map.set(normalized, index);
    }
  });
  return map;
}

// ✅ 컬럼 인덱스 찾기 (aliases 지원)
function findColumnIndex(headerMap: Map<string, number>, targetKey: string): number | null {
  // 1) 정확한 키로 찾기
  if (headerMap.has(targetKey)) {
    return headerMap.get(targetKey)!;
  }
  
  // 2) aliases로 찾기
  const aliases = COLUMN_ALIASES[targetKey] || [];
  for (const alias of aliases) {
    const normalized = normalizeHeader(alias);
    if (headerMap.has(normalized)) {
      return headerMap.get(normalized)!;
    }
  }
  
  // 3) 정규화된 targetKey로 찾기
  const normalizedTarget = normalizeHeader(targetKey);
  if (headerMap.has(normalizedTarget)) {
    return headerMap.get(normalizedTarget)!;
  }
  
  return null;
}

// ✅ 컬럼 값 가져오기 (헤더 맵 사용)
function getColumnValueByIndex(row: any[], colIndex: number | null): any {
  if (colIndex === null || colIndex < 0 || colIndex >= row.length) {
    return undefined;
  }
  return row[colIndex];
}

// 유틸리티 함수
const t = (v: any): string => (v ?? "").toString().trim();
const toInt = (v: any): number | null => {
  const n = parseInt(t(v), 10);
  return Number.isFinite(n) ? n : null;
};

// content_hash 생성: sha256(grade|subject|category|difficulty|JSON.stringify(content))
// content 전체를 포함하여 충돌/덮어쓰기 방지
function generateContentHash(
  grade: string,
  subject: string,
  category: string,
  difficulty: string,
  content: any
): string {
  const hashInput = {
    grade,
    subject,
    category,
    difficulty,
    content,
  };
  return crypto.createHash("sha256").update(JSON.stringify(hashInput)).digest("hex");
}

// 번호를 5자리 문자열로 변환
function formatNumber(num: number | null): string {
  if (num === null) return "00000";
  return String(num).padStart(5, "0");
}

// 배치 upsert (중복 체크 포함)
async function upsertBatch(rows: any[]): Promise<{ success: number; failed: number; skipped: number; duplicate: number }> {
  let success = 0;
  let failed = 0;
  let skipped = 0;
  let duplicate = 0;

  // 중복 체크: content_hash로 기존 데이터 확인
  const contentHashes = rows.map(r => r.content_hash);
  const { data: existingData, error: checkError } = await supabase
    .from(TABLE)
    .select("content_hash")
    .in("content_hash", contentHashes);

  if (checkError) {
    console.warn(`⚠️  중복 체크 실패: ${checkError.message}, upsert 계속 진행`);
  } else {
    const existingHashes = new Set((existingData ?? []).map((r: any) => r.content_hash));
    duplicate = rows.filter(r => existingHashes.has(r.content_hash)).length;
  }

  const { data, error } = await supabase
    .from(TABLE)
    .upsert(rows, { onConflict: "content_hash" })
    .select();

  if (error) {
    console.error("UPSERT_ERROR", error);
    console.error(`❌ 배치 upsert 실패: ${error.message}`);
    // 에러가 있으면 throw하여 실패로 끝내기 (성공 카운트 뻥 금지)
    throw new Error(`배치 upsert 실패: ${error.message}`);
  }

  // upsert 결과 확인 (insert 또는 update 모두 성공으로 처리)
  // 에러가 없을 때만 성공 카운트 증가
  success += rows.length;
  return { success, failed, skipped, duplicate };
}

// 메인 함수
async function main() {
  // 인자 파싱
  const args = process.argv.slice(2);
  const filePath = args[0];

  if (!filePath) {
    console.error("사용법: tsx scripts/importProblemsFromXlsx.ts <엑셀파일경로> [--grade <grade>] [--subject <subject>] [--qtype <qtype>]");
    console.error("예시 1 (혼합 qtype): tsx scripts/importProblemsFromXlsx.ts data/inbox/questions.xlsx --grade 2 --subject english");
    console.error("예시 2 (단일 qtype): tsx scripts/importProblemsFromXlsx.ts data/inbox/questions.xlsx --grade 2 --subject english --qtype 어휘_영영");
    console.error("\n허용된 qtype:");
    console.error("  어휘_사전, 어휘_영영, 어휘_문맥");
    console.error("  문법_어법오류, 문법_빈칸, 문법_배열");
    console.error("  본문_제목, 본문_물음, 본문_일치");
    console.error("  대화문_빈칸, 대화문_흐름, 대화문_응답");
    process.exit(1);
  }

  // 옵션 파싱
  let grade = "2";
  let subject = "english";
  let globalQtype: string | null = null;
  let userCategory: string | null = null;
  let sampleLimit: number | null = null; // --sample 옵션 (기본값: null = 제한 없음)

  for (let i = 1; i < args.length; i += 2) {
    const key = args[i];
    const value = args[i + 1];
    if (key === "--grade") grade = value;
    else if (key === "--subject") subject = value;
    else if (key === "--category") {
      userCategory = value;
      console.warn(`⚠️  --category 옵션은 무시됩니다. qtype에서 자동으로 category가 매핑됩니다.`);
    }
    else if (key === "--qtype") {
      globalQtype = value;
      // qtype 허용 목록 검증
      if (!ALLOWED_QTYPES.has(globalQtype)) {
        console.error(`❌ 허용되지 않은 qtype: ${globalQtype}`);
        console.error("\n허용된 qtype:");
        console.error("  어휘_사전, 어휘_영영, 어휘_문맥");
        console.error("  문법_어법오류, 문법_빈칸, 문법_배열");
        console.error("  본문_제목, 본문_물음, 본문_일치");
        console.error("  대화문_빈칸, 대화문_흐름, 대화문_응답");
        process.exit(1);
      }
    }
    else if (key === "--sample") {
      const limit = parseInt(value, 10);
      if (isNaN(limit) || limit <= 0) {
        console.error(`❌ --sample 옵션은 양수여야 합니다: ${value}`);
        process.exit(1);
      }
      sampleLimit = limit;
    }
  }

  console.log(`📂 파일: ${filePath}`);
  if (globalQtype) {
    console.log(`📋 옵션: grade=${grade}, subject=${subject}, qtype=${globalQtype} (전체 행에 적용)`);
  } else {
    console.log(`📋 옵션: grade=${grade}, subject=${subject}, qtype=엑셀 컬럼에서 읽기`);
  }
  if (sampleLimit) {
    console.log(`📋 샘플링: 카테고리별 ${sampleLimit}개로 제한`);
  } else {
    console.log(`📋 샘플링: 제한 없음 (전량 업로드)`);
  }

  // 엑셀 파일 읽기
  let wb: xlsx.WorkBook;
  try {
    wb = xlsx.readFile(filePath);
  } catch (error) {
    console.error(`❌ 엑셀 파일 읽기 실패: ${error}`);
    process.exit(1);
  }

  // 모든 시트 읽기
  const sheetNames = wb.SheetNames;
  if (sheetNames.length === 0) {
    console.error("❌ 엑셀 파일에 시트가 없습니다.");
    process.exit(1);
  }

  console.log(`📁 파일명: ${filePath}`);
  console.log(`📊 총 시트 수: ${sheetNames.length}개`);

  // UNIQUE_HASHES 계산을 위한 준비
  const allHashes = new Set<string>();

  // 통계
  let totalSuccess = 0;
  let totalFailed = 0;
  let totalSkipped = 0;
  let totalDuplicate = 0; // 중복된 content_hash (upsert에서 update된 경우)
  const qtypeCounts = new Map<string, number>(); // qtype별 업로드 개수
  const categoryCounts = new Map<string, number>(); // category별 업로드 개수 (샘플링용)
  let explanationNonEmptyCount = 0; // 해설(explanationText) 비어있지 않은 row 수
  const explanationQtypeCounts = new Map<string, number>(); // qtype별 해설 보유 개수
  
  // 스킵 사유별 카운트
  const skipReasons = {
    샘플링제한: 0,
    번호없음: 0,
    문제없음: 0,
    정답번호유효하지않음: 0,
    보기없음: 0,
    qtype불일치: 0,
  };

  // 배치 처리
  let payloads: any[] = [];
  let batchCount = 0;
  let totalRowsRead = 0;
  
  // ✅ 샘플 저장용 배열 (전역)
  const samplePayloads: any[] = [];

  // 시트별로 처리
  for (const sheetName of sheetNames) {
    // README 같은 안내 시트는 스킵
    if (sheetName.toUpperCase() === "README" || sheetName.toUpperCase().includes("README")) {
      console.log(`⏭️  시트 스킵: ${sheetName} (안내 시트)`);
      continue;
    }

    const ws = wb.Sheets[sheetName];
    if (!ws) {
      console.log(`⏭️  시트 스킵: ${sheetName} (시트 없음)`);
      continue;
    }

    // ✅ 헤더 맵 생성 (첫 번째 행)
    const sheetData = xlsx.utils.sheet_to_json(ws, { defval: "", header: 1 }) as any[][];
    if (sheetData.length === 0) {
      console.log(`⏭️  시트 스킵: ${sheetName} (데이터 없음)`);
      continue;
    }
    
    const headers = sheetData[0] as string[];
    const headerMap = createHeaderMap(headers);
    
    // ✅ 컬럼 인덱스 찾기
    const colIndex = {
      번호: findColumnIndex(headerMap, "번호"),
      문제: findColumnIndex(headerMap, "문제"),
      지문: findColumnIndex(headerMap, "지문"),
      보기1: findColumnIndex(headerMap, "보기1"),
      보기2: findColumnIndex(headerMap, "보기2"),
      보기3: findColumnIndex(headerMap, "보기3"),
      보기4: findColumnIndex(headerMap, "보기4"),
      보기5: findColumnIndex(headerMap, "보기5"),
      정답번호: findColumnIndex(headerMap, "정답번호"),
      해설: findColumnIndex(headerMap, "해설"),
      비고: findColumnIndex(headerMap, "비고"),
      메모: findColumnIndex(headerMap, "메모"),
      qtype: findColumnIndex(headerMap, "qtype"),
    };

    // ✅ 해설 컬럼 인덱스 디버깅 (괄호 제거/정규화 후에도 제대로 잡히는지 확인)
    console.log("해설 colIndex:", colIndex.해설, "헤더:", headers);

    console.log(`📄 시트: ${sheetName} (${sheetData.length - 1}행, 헤더: ${headers.join(", ")})`);
    totalRowsRead += sheetData.length - 1;

    // 시트명을 qtype으로 사용 (컬럼이 비어있을 때)
    const sheetQtype = sheetName.trim();

    // 데이터 행 처리 (첫 번째 행은 헤더이므로 1부터 시작)
    for (let i = 1; i < sheetData.length; i++) {
      const row = sheetData[i] as any[];

      // ✅ 컬럼 읽기 (헤더 맵 사용)
      const 번호 = toInt(getColumnValueByIndex(row, colIndex.번호));
      const 문제 = t(getColumnValueByIndex(row, colIndex.문제));
      // ✅ 지문(없으면 비움) / 지문 컬럼 + B열(index 1) fallback
      let rawStimulus = getColumnValueByIndex(row, colIndex.지문);
      if ((rawStimulus === undefined || rawStimulus === null || rawStimulus === "") && Array.isArray(row) && row.length > 1) {
        rawStimulus = row[1]; // B열(인덱스 1) 값으로 fallback
      }
      const 지문 = t(rawStimulus);
      const 보기1 = t(getColumnValueByIndex(row, colIndex.보기1));
      const 보기2 = t(getColumnValueByIndex(row, colIndex.보기2));
      const 보기3 = t(getColumnValueByIndex(row, colIndex.보기3));
      const 보기4 = t(getColumnValueByIndex(row, colIndex.보기4));
      const 보기5 = t(getColumnValueByIndex(row, colIndex.보기5));
      const 해설원본 = t(getColumnValueByIndex(row, colIndex.해설));
      const 비고원본 = t(getColumnValueByIndex(row, colIndex.비고));
      const 메모원본 = t(getColumnValueByIndex(row, colIndex.메모));
      // ✅ 해설 후보: 해설 > 비고 > 메모 (trim만, 줄바꿈 유지)
      const explanationText = 해설원본 || 비고원본 || 메모원본;
      
      // ✅ 정답번호 파싱 강화: "3" / 3 / " 3 " 모두 인식
      let 정답번호원본: any = getColumnValueByIndex(row, colIndex.정답번호);
      let 정답번호: number | null = null;
      
      if (정답번호원본 !== undefined && 정답번호원본 !== null && 정답번호원본 !== '') {
        const s = String(정답번호원본).trim();
        const n = parseInt(s, 10);
        // ✅ 정답번호 1~5 검증 강화
        if (Number.isInteger(n) && n >= 1 && n <= 5) {
          정답번호 = n;
        }
      }
      
      // qtype 결정: --qtype 옵션이 있으면 사용, 없으면 엑셀 컬럼에서 읽기, 그것도 없으면 시트명 사용
      let rowQtype: string | null = null;
      if (globalQtype) {
        rowQtype = globalQtype;
      } else {
        const columnQtype = t(getColumnValueByIndex(row, colIndex.qtype));
        rowQtype = columnQtype || sheetQtype; // 컬럼이 비어있으면 시트명 사용
      }

      // qtype 허용 목록 검증
      if (!ALLOWED_QTYPES.has(rowQtype)) {
        skipReasons.qtype불일치++;
        console.warn(`⚠️  [${sheetName}] ${i + 1}행: 허용되지 않은 qtype: ${rowQtype} (스킵)`);
        totalSkipped++;
        continue;
      }

      // ✅ category는 qtype prefix로만 결정 (어휘_/문법_/본문_/대화문_)
      const category = categoryFromQtype(rowQtype);

      // 샘플링 제한 적용 (카테고리별)
      if (sampleLimit !== null) {
        const currentCount = categoryCounts.get(category) ?? 0;
        if (currentCount >= sampleLimit) {
          skipReasons.샘플링제한++;
          totalSkipped++;
          continue; // 이미 해당 카테고리에서 sampleLimit개를 처리했으므로 스킵
        }
        categoryCounts.set(category, currentCount + 1);
      }

      // 필수 필드 검증
      if (!번호) {
        skipReasons.번호없음++;
        console.warn(`⚠️  [${sheetName}] ${i + 1}행: 번호가 없어 스킵합니다.`);
        totalSkipped++;
        continue;
      }

      if (!문제) {
        skipReasons.문제없음++;
        console.warn(`⚠️  [${sheetName}] ${i + 1}행: 문제가 없어 스킵합니다.`);
        totalSkipped++;
        continue;
      }

      if (!정답번호) {
        skipReasons.정답번호유효하지않음++;
        console.warn(`⚠️  [${sheetName}] ${i + 1}행: 정답번호가 유효하지 않아 스킵합니다.`);
        console.log('INVALID_ANSWER_RAW =', 정답번호원본);
        totalSkipped++;
        continue;
      }

      // ✅ 보기1~보기5 모두 필수 (5지선다 표준화)
      if (!보기1 || !보기2 || !보기3 || !보기4 || !보기5) {
        skipReasons.보기없음++;
        console.warn(`⚠️  [${sheetName}] ${i + 1}행: 보기1~보기5가 모두 필요합니다. (현재: 보기1=${!!보기1}, 보기2=${!!보기2}, 보기3=${!!보기3}, 보기4=${!!보기4}, 보기5=${!!보기5})`);
        totalSkipped++;
        continue;
      }

      // 보기 배열 생성 (5지선다)
      const choices = [보기1, 보기2, 보기3, 보기4, 보기5];

      // ✅ stimulus용 지문 문자열 (줄바꿈 유지, 앞뒤만 trim)
      const stimulus = String(지문 ?? "").trim();

      // ✅ content.raw 구조 생성 (한국어 키만 사용, 표준 저장)
      const contentRaw: any = {
        문제: 문제, // ✅ 한국어 키로 저장
        지문: 지문 || null, // ✅ 한국어 키로 저장 (없으면 null)
        보기1: 보기1, // ✅ 명시적으로 보기1~보기5 저장
        보기2: 보기2,
        보기3: 보기3,
        보기4: 보기4,
        보기5: 보기5,
        정답번호: 정답번호, // ✅ 명시적으로 정답번호 저장
        해설: explanationText || null, // ✅ 한국어 키로 저장 (없으면 null)
        qtype: rowQtype,  // 최종 qtype으로 저장
      };

      // content 구조 (최상위에 qtype 추가)
      const content = {
        qtype: rowQtype,  // content 최상위에 qtype 추가
        stimulus: stimulus || undefined, // ✅ 엑셀 B열 지문을 stimulus로 저장 (없으면 undefined)
        explanation: explanationText || undefined, // ✅ top-level 해설 저장 (없으면 undefined)
        raw: contentRaw,
      };

      // difficulty 기본값 설정
      const difficulty = "1"; // 기본값

      // content_hash 생성 (grade/subject/category/difficulty + content 전체 포함)
      const content_hash = generateContentHash(grade, subject, category, difficulty, content);
      
      // UNIQUE_HASHES 추적
      allHashes.add(content_hash);

      // 해설 통계 집계 (비어있지 않은 explanationText만)
      if (explanationText) {
        explanationNonEmptyCount++;
        explanationQtypeCounts.set(rowQtype, (explanationQtypeCounts.get(rowQtype) ?? 0) + 1);
      }

      // payload 생성
      const payload = {
        grade,
        subject,
        category,
        difficulty,
        content_hash,
        content,
      };
      
      payloads.push(payload);
      
      // ✅ 샘플 저장 (최대 3개)
      if (samplePayloads.length < 3) {
        samplePayloads.push({
          번호,
          문제,
          지문: 지문 || "(없음)",
          보기1,
          보기2,
          보기3,
          보기4,
          보기5,
          정답번호,
          해설: explanationText || "(없음)",
          qtype: rowQtype,
          contentRaw, // 실제 저장될 content.raw
        });
      }

      // qtype별 개수 추적 (성공 예상)
      qtypeCounts.set(rowQtype, (qtypeCounts.get(rowQtype) ?? 0) + 1);

      // 200개 단위로 배치 upsert
      if (payloads.length >= 200) {
        batchCount++;
        process.stdout.write(`\n🔄 배치 ${batchCount} 처리 중... `);
        const result = await upsertBatch(payloads);
        totalSuccess += result.success;
        totalFailed += result.failed;
        totalSkipped += result.skipped;
        totalDuplicate += result.duplicate;
        payloads = [];
        process.stdout.write(`✅ 완료`);
      }
    }
  }

  // 남은 payload 처리
  if (payloads.length > 0) {
    batchCount++;
    process.stdout.write(`\n🔄 배치 ${batchCount} 처리 중... `);
    const result = await upsertBatch(payloads);
    totalSuccess += result.success;
    totalFailed += result.failed;
    totalSkipped += result.skipped;
    totalDuplicate += result.duplicate;
    process.stdout.write(`✅ 완료\n`);
  }

  // UNIQUE_HASHES 로그 출력
  console.log(`\nALL_SHEETS_ROWS = ${totalRowsRead}`);
  console.log(`UNIQUE_HASHES = ${allHashes.size}`);
  console.log(`PAYLOAD_LEN = ${totalSuccess + totalFailed} (성공: ${totalSuccess}, 실패: ${totalFailed})`);

  // ✅ 해설(explanationText) 통계 로그
  console.log(`\n📋 해설 통계`);
  console.log(`  explanationText 비어있지 않은 row 수: ${explanationNonEmptyCount}`);
  if (explanationQtypeCounts.size > 0) {
    console.log(`  qtype별 해설 보유 개수:`);
    const sortedExpQtypes = Array.from(explanationQtypeCounts.entries()).sort((a, b) => a[0].localeCompare(b[0]));
    for (const [qtype, count] of sortedExpQtypes) {
      console.log(`    ${qtype}: ${count}개`);
    }
  }

  // 최종 결과 출력
  console.log("\n" + "=".repeat(50));
  console.log("📊 최종 결과");
  console.log("=".repeat(50));
  console.log(`📁 파일명: ${filePath}`);
  console.log(`📝 읽은 전체 행 수: ${totalRowsRead}행`);
  console.log(`✅ 업로드된 수: ${totalSuccess}개`);
  console.log(`⚠️  스킵된 수: ${totalSkipped}개`);
  
  // 스킵 사유별 상세 카운트 (중복/형식오류/qtype불일치)
  const formatErrors = skipReasons.번호없음 + skipReasons.문제없음 + skipReasons.정답번호유효하지않음 + skipReasons.보기없음;
  const hasSkips = totalSkipped > 0 || totalDuplicate > 0;
  
  if (hasSkips) {
    console.log("\n📋 스킵 사유별 상세:");
    if (totalDuplicate > 0) console.log(`  중복: ${totalDuplicate}개 (content_hash 중복, upsert로 업데이트됨)`);
    if (skipReasons.샘플링제한 > 0) console.log(`  샘플링 제한: ${skipReasons.샘플링제한}개`);
    if (formatErrors > 0) console.log(`  형식오류: ${formatErrors}개`);
    if (skipReasons.번호없음 > 0) console.log(`    - 번호 없음: ${skipReasons.번호없음}개`);
    if (skipReasons.문제없음 > 0) console.log(`    - 문제 없음: ${skipReasons.문제없음}개`);
    if (skipReasons.정답번호유효하지않음 > 0) console.log(`    - 정답번호 유효하지 않음: ${skipReasons.정답번호유효하지않음}개`);
    if (skipReasons.보기없음 > 0) console.log(`    - 보기 없음: ${skipReasons.보기없음}개`);
    if (skipReasons.qtype불일치 > 0) console.log(`  qtype불일치: ${skipReasons.qtype불일치}개`);
  }
  
  // qtype별 업로드 개수 요약
  if (qtypeCounts.size > 0) {
    console.log("\n📋 qtype별 업로드 개수:");
    const sortedQtypes = Array.from(qtypeCounts.entries()).sort((a, b) => a[0].localeCompare(b[0]));
    for (const [qtype, count] of sortedQtypes) {
      const category = categoryFromQtype(qtype);
      console.log(`  ${qtype} (${category}): ${count}개`);
    }
  }
  
  // category별 업로드 개수 요약 (summary)
  const summary: Record<string, number> = {};
  for (const [qtype, count] of qtypeCounts.entries()) {
    const category = categoryFromQtype(qtype);
    summary[category] = (summary[category] || 0) + count;
  }
  
  if (Object.keys(summary).length > 0) {
    console.log("\n📋 category별 업로드 개수 (summary):");
    const sortedCategories = Object.entries(summary).sort((a, b) => a[0].localeCompare(b[0]));
    for (const [category, count] of sortedCategories) {
      console.log(`  ${category}: ${count}개`);
    }
  }
  
  console.log("=".repeat(50));

  // 실제 DB row count 확인
  console.log("\n🔍 실제 DB row count 확인 중...");
  const { count, error: countErr } = await supabase
    .from(TABLE)
    .select("id", { count: "exact", head: true });
  
  console.log("DB_COUNT_AFTER_UPLOAD =", count, "COUNT_ERR =", countErr);
  
  if (countErr) {
    console.error("❌ DB count 조회 실패:", countErr);
  } else {
    console.log(`✅ 실제 DB에 저장된 문제 수: ${count}개`);
    if (count !== totalSuccess) {
      console.warn(`⚠️  경고: 업로드 성공 카운트(${totalSuccess})와 실제 DB count(${count})가 다릅니다.`);
    }
  }
  
  console.log("\n📋 확인 SQL:");
  console.log("select count(*) total, count(*) filter (where created_at > now()-interval '2 hours') last_2h from public.problems;");

  // ✅ stimulus 필드 저장 검증 (content->>'stimulus'가 비어있지 않은 레코드 수)
  console.log("\n🔍 stimulus 필드 저장 여부 확인 중...");
  const { count: stimulusCount, error: stimulusErr } = await supabase
    .from(TABLE)
    .select("id", { count: "exact", head: true })
    .not("content->>stimulus", "is", null);

  if (stimulusErr) {
    console.error("❌ stimulus 필드 count 조회 실패:", stimulusErr);
  } else {
    console.log(`✅ content->>'stimulus'가 NOT NULL인 레코드 수: ${stimulusCount}개`);
    console.log(`stimulus saved count: ${stimulusCount}`);
    
    // ✅ stimulus가 0개면 즉시 실패 처리 (엑셀 매핑 문제)
    if (!stimulusCount || stimulusCount === 0) {
      throw new Error("지문(B열)이 DB에 저장되지 않았습니다. 엑셀 헤더/매핑을 확인하세요.");
    }

    // ✅ stimulus가 있는 레코드 1개를 조회해 120자 프리뷰 출력
    const { data: stimulusRows, error: stimulusSampleErr } = await supabase
      .from(TABLE)
      .select("id, content")
      .not("content->>stimulus", "is", null)
      .limit(1);

    if (stimulusSampleErr) {
      console.error("❌ stimulus 샘플 조회 실패:", stimulusSampleErr);
    } else if (stimulusRows && stimulusRows.length > 0) {
      const first = stimulusRows[0] as any;
      const s = String(first?.content?.stimulus ?? "").trim();
      const preview = s.length > 120 ? `${s.slice(0, 120)}...` : s;
      console.log(`stimulus preview (first record, 120 chars): ${preview}`);
    }
  }
  
  // ✅ 업로드 마지막에 샘플 3개 로그 출력
  if (samplePayloads.length > 0) {
    console.log("\n" + "=".repeat(50));
    console.log("📋 샘플 데이터 (content.raw 저장 확인용)");
    console.log("=".repeat(50));
    samplePayloads.forEach((sample, idx) => {
      console.log(`\n[샘플 ${idx + 1}]`);
      console.log(`  번호: ${sample.번호}`);
      console.log(`  문제: ${sample.문제.substring(0, 50)}${sample.문제.length > 50 ? "..." : ""}`);
      console.log(`  지문: ${sample.지문}`);
      console.log(`  보기1: ${sample.보기1}`);
      console.log(`  보기2: ${sample.보기2}`);
      console.log(`  보기3: ${sample.보기3}`);
      console.log(`  보기4: ${sample.보기4}`);
      console.log(`  보기5: ${sample.보기5}`);
      console.log(`  정답번호: ${sample.정답번호}`);
      console.log(`  해설: ${sample.해설}`);
      console.log(`  qtype: ${sample.qtype}`);
      console.log(`\n  ✅ 실제 저장될 content.raw:`);
      console.log(`    content.raw["문제"] = "${sample.contentRaw.문제}"`);
      console.log(`    content.raw["지문"] = ${sample.contentRaw.지문 === null ? "null" : `"${sample.contentRaw.지문}"`}`);
      console.log(`    content.raw["보기1"] = "${sample.contentRaw.보기1}"`);
      console.log(`    content.raw["보기2"] = "${sample.contentRaw.보기2}"`);
      console.log(`    content.raw["보기3"] = "${sample.contentRaw.보기3}"`);
      console.log(`    content.raw["보기4"] = "${sample.contentRaw.보기4}"`);
      console.log(`    content.raw["보기5"] = "${sample.contentRaw.보기5}"`);
      console.log(`    content.raw["정답번호"] = ${sample.contentRaw.정답번호}`);
      console.log(`    content.raw["해설"] = ${sample.contentRaw.해설 === null ? "null" : `"${sample.contentRaw.해설}"`}`);
      console.log(`    content.raw["qtype"] = "${sample.contentRaw.qtype}"`);
    });
    console.log("=".repeat(50));
  }
}

main().catch((error) => {
  console.error("❌ 실행 중 오류:", error);
  process.exit(1);
});


