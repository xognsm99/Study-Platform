import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const regionId = searchParams.get("regionId");

    if (!regionId) {
      return NextResponse.json(
        { error: "regionId is required" },
        { status: 400 }
      );
    }

    const provinces = await prisma.province.findMany({
      where: { regionId },
      orderBy: { name: "asc" },
    });

    return NextResponse.json({ provinces });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message ?? "Failed to fetch provinces" },
      { status: 500 }
    );
  }
}

