import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });



import xlsx from "xlsx";

import { createClient } from "@supabase/supabase-js";

import crypto from "node:crypto";



const TABLE = "problems";



const SUPABASE_URL = process.env.SUPABASE_URL;

const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;



if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {

  console.error("❌ .env.local에 SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY 필요");

  process.exit(1);

}



const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {

  auth: { persistSession: false },

});



// ✅ 엑셀 시트명 정확히 여기랑 같아야 함

const SHEET_MAP = {

  "문법_어법오류": { category: "grammar",    qtype: "error" },

  "문법_빈칸":     { category: "grammar",    qtype: "blank" },



  "본문_제목":     { category: "reading",    qtype: "title" },

  "본문_물음":     { category: "reading",    qtype: "question" },



  "대화문_빈칸":   { category: "dialogue",   qtype: "blank" },

  "대화문_흐름":   { category: "dialogue",   qtype: "flow" },



  "어휘_사전":     { category: "vocabulary", qtype: "dict" },

  "어휘_영영":     { category: "vocabulary", qtype: "eng_eng" },

};



const file = process.argv[2];

if (!file) {

  console.error("사용법: node scripts/import-problems-xlsx.mjs .\\data\\questions.xlsx");

  process.exit(1);

}



const wb = xlsx.readFile(file);



const COL = {

  passage: "지문(없으면 비움)",

  question: "문제",

  c1: "보기1",

  c2: "보기2",

  c3: "보기3",

  c4: "보기4",

  c5: "보기5(없으면 비움)",

  answerNo: "정답번호(1~5)",

  explain: "해설(없으면 비움)",

};



const t = (v) => (v ?? "").toString().trim();

const toInt = (v) => {

  const n = parseInt(t(v), 10);

  return Number.isFinite(n) ? n : null;

};



async function insertBatch(rows) {

  const { error } = await supabase.from(TABLE).insert(rows);

  if (error) throw new Error(error.message);

}



for (const [sheetName, meta] of Object.entries(SHEET_MAP)) {

  const ws = wb.Sheets[sheetName];

  if (!ws) {

    console.log(`- skip: 시트 없음 -> ${sheetName}`);

    continue;

  }



  const rows = xlsx.utils.sheet_to_json(ws, { defval: "" });



  let payloads = [];

  let count = 0;



  for (const r of rows) {

    const passage = t(r[COL.passage]);

    const question = t(r[COL.question]);



    const choices = [

      t(r[COL.c1]), t(r[COL.c2]), t(r[COL.c3]), t(r[COL.c4]), t(r[COL.c5])

    ].filter(Boolean);



    const answer_no = toInt(r[COL.answerNo]);

    const explanation = t(r[COL.explain]);



    if (!passage && !question && choices.length === 0) continue;



    if (!question) {

      console.error(`❌ [${sheetName}] 문제 칸이 비어있음 (question 필수)`);

      process.exit(1);

    }



    const content = {

      raw: {

        id: crypto.randomUUID(),

        qtype: meta.qtype,

        passage: passage || null,

        question,

        choices,

        answer_no,

        explanation: explanation || null,

      },

    };



    const content_hash = crypto

      .createHash("sha256")

      .update(JSON.stringify(content.raw))

      .digest("hex");



    payloads.push({

      grade: "2",

      subject: "english",

      category: meta.category,

      difficulty: "1",

      content_hash,

      content,

    });



    if (payloads.length >= 200) {

      await insertBatch(payloads);

      count += payloads.length;

      payloads = [];

      process.stdout.write(".");

    }

  }



  if (payloads.length) {

    await insertBatch(payloads);

    count += payloads.length;

  }



  console.log(`\n✅ ${sheetName} 업로드 완료: ${count}문항`);

}



console.log("✅ 전체 업로드 완료");

