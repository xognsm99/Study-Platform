import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { base64Image } = await req.json();

    const apiKey = process.env.GOOGLE_VISION_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "Missing GOOGLE_VISION_API_KEY" },
        { status: 500 }
      );
    }

    const resp = await fetch(
      `https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requests: [
            {
              image: { content: base64Image },
              // ✅ 이걸로 바꿔 (손글씨/문장에 더 강함)
              features: [{ type: "DOCUMENT_TEXT_DETECTION", maxResults: 1 }],
              // ✅ 영어 힌트(선택이지만 도움 됨)
              imageContext: { languageHints: ["en"] },
            },
          ],
        }),
      }
    );

    const data = await resp.json();

    // ✅ 에러면 그대로 내려서 디버깅 가능하게
    if (!resp.ok) {
      return NextResponse.json(
        { error: data?.error?.message ?? "Vision API error", details: data },
        { status: resp.status }
      );
    }

    const r0 = data?.responses?.[0] ?? {};

    // ✅ 핵심: 두 군데 다 확인
    const rawText =
      r0?.fullTextAnnotation?.text ??
      r0?.textAnnotations?.[0]?.description ??
      "";

    const text = String(rawText).trim();

    return NextResponse.json({ text });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message ?? "Server error" },
      { status: 500 }
    );
  }
}
