import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const cityId = searchParams.get("cityId");

    if (!cityId) {
      return NextResponse.json(
        { error: "cityId is required" },
        { status: 400 }
      );
    }

    const schools = await prisma.school.findMany({
      where: { cityId },
      orderBy: { name: "asc" },
    });

    return NextResponse.json({ schools });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message ?? "Failed to fetch schools" },
      { status: 500 }
    );
  }
}

