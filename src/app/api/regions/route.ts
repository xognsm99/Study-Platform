import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const regions = await prisma.region.findMany({
      orderBy: { name: "asc" },
    });

    return NextResponse.json({ regions });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message ?? "Failed to fetch regions" },
      { status: 500 }
    );
  }
}

