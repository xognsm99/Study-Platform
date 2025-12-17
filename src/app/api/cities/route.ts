import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const provinceId = searchParams.get("provinceId");

    if (!provinceId) {
      return NextResponse.json(
        { error: "provinceId is required" },
        { status: 400 }
      );
    }

    const cities = await prisma.city.findMany({
      where: { provinceId },
      orderBy: { name: "asc" },
    });

    return NextResponse.json({ cities });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message ?? "Failed to fetch cities" },
      { status: 500 }
    );
  }
}

