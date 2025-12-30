import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const { paymentId, cycle } = await req.json();

  const secret = process.env.PORTONE_API_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "PORTONE_API_SECRET 없음(.env.local 확인)" }, { status: 500 });
  }

  const r = await fetch(`https://api.portone.io/payments/${encodeURIComponent(paymentId)}`, {
    headers: { Authorization: `PortOne ${secret}` },
  });

  if (!r.ok) {
    const detail = await r.text();
    return NextResponse.json({ error: "포트원 결제 조회 실패", detail }, { status: 400 });
  }

  const payment = await r.json();

  if (payment.status !== "PAID") {
    return NextResponse.json({ error: `결제 상태: ${payment.status}` }, { status: 402 });
  }

  const expected = cycle === "yearly" ? 89000 : 9900;
  const paid = payment.amount?.total;

  if (paid !== expected) {
    return NextResponse.json(
      { error: `금액 불일치: paid=${paid} expected=${expected}` },
      { status: 400 }
    );
  }

  return NextResponse.json({ ok: true });
}
