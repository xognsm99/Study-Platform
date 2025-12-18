import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
dotenv.config();

import fs from "fs";
import path from "path";
import { createClient } from "@supabase/supabase-js";

function countBlanks(sentence: string) {
  return (sentence.match(/\(\)/g) || []).length;
}

function normalizeAnswer(s: string) {
  return String(s).trim().toLowerCase();
}

function isAZ(s: string) {
  return /^[a-z]+$/.test(s);
}

async function main() {
  const filePath = process.argv[2];
  if (!filePath) {
    console.error("Usage: ts-node scripts/import-vocab-keypad-tsv.ts <path-to-tsv>");
    process.exit(1);
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anon) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY");
  }

  const supabase = createClient(url, anon);

  const abs = path.resolve(filePath);
  const text = fs.readFileSync(abs, "utf-8");
  const lines = text.split(/\r?\n/).filter(Boolean);

  // header
  const header = lines[0];
  const rows = lines.slice(1);

  // no grade subject qtype sentence answers_json level tags
  const payload: any[] = [];

  let skip = 0;
  const reasons: Record<string, number> = {};

  for (const line of rows) {
    const cols = line.split("\t");
    if (cols.length < 8) {
      skip++;
      reasons["컬럼부족"] = (reasons["컬럼부족"] || 0) + 1;
      continue;
    }

    const grade = String(cols[1]).trim();
    const subject = String(cols[2]).trim();
    const qtype = String(cols[3]).trim();
    const sentence = String(cols[4]).trim();
    const answersJson = String(cols[5]).trim();
    const level = String(cols[6]).trim();
    const tags = String(cols[7]).trim();

    if (qtype !== "vocab_keypad") {
      skip++;
      reasons["qtype불일치"] = (reasons["qtype불일치"] || 0) + 1;
      continue;
    }

    let answers: string[];
    try {
      const parsed = JSON.parse(answersJson);
      if (!Array.isArray(parsed)) throw new Error("answers not array");
      answers = parsed.map(normalizeAnswer);
    } catch {
      skip++;
      reasons["answers_json파싱실패"] = (reasons["answers_json파싱실패"] || 0) + 1;
      continue;
    }

    // validate
    const blankCnt = countBlanks(sentence);
    if (blankCnt !== answers.length) {
      skip++;
      reasons["빈칸수불일치"] = (reasons["빈칸수불일치"] || 0) + 1;
      continue;
    }

    if (answers.some(a => !isAZ(a))) {
      skip++;
      reasons["정답형식불량"] = (reasons["정답형식불량"] || 0) + 1;
      continue;
    }

    payload.push({
      grade,
      subject,
      qtype,
      sentence,
      answers,
      level: level || null,
      tags: tags || null,
    });
  }

  console.log("ROWS_READ =", rows.length);
  console.log("PAYLOAD_LEN =", payload.length);
  console.log("SKIP =", skip);
  console.log("REASONS =", reasons);

  if (payload.length === 0) {
    console.log("Nothing to insert.");
    return;
  }

  // insert in chunks
  const chunkSize = 200;
  for (let i = 0; i < payload.length; i += chunkSize) {
    const chunk = payload.slice(i, i + chunkSize);
    const { error } = await supabase.from("vocab_keypad_problems").insert(chunk);
    if (error) throw error;
  }

  console.log("✅ inserted =", payload.length);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
