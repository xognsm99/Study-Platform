import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const schoolId = searchParams.get("schoolId");
    const grade = searchParams.get("grade");
    const subject = searchParams.get("subject");

    if (!schoolId || !grade || !subject) {
      return NextResponse.json(
        { error: "schoolId, grade, and subject are required" },
        { status: 400 }
      );
    }

    const map = await prisma.schoolTextbookMap.findUnique({
      where: {
        schoolId_grade_subject: {
          schoolId,
          grade,
          subject,
        },
      },
      include: {
        school: {
          select: {
            name: true,
          },
        },
      },
    });

    // Map이 없으면 동아출판사로 기본값 생성 (fallback)
    const DEFAULT_PUBLISHER = "동아출판사";
    
    if (!map) {
      // 학교 정보 가져오기
      const school = await prisma.school.findUnique({
        where: { id: schoolId },
        select: { name: true },
      });

      if (!school) {
        return NextResponse.json(
          { error: "School not found" },
          { status: 404 }
        );
      }

      // 기본값으로 응답 (동아출판사)
      const defaultBlueprint = await prisma.publisherBlueprint.findUnique({
        where: {
          grade_subject_publisher: {
            grade,
            subject,
            publisher: DEFAULT_PUBLISHER,
          },
        },
      });

      return NextResponse.json({
        map: {
          schoolId,
          schoolName: school.name,
          grade,
          subject,
          publisher: DEFAULT_PUBLISHER,
          year: null,
        },
        blueprint: defaultBlueprint
          ? {
              styleJson: JSON.parse(defaultBlueprint.styleJson || "{}"),
            }
          : null,
      });
    }

    // Get blueprint for this publisher
    const publisher = map.publisher || DEFAULT_PUBLISHER;
    const blueprint = await prisma.publisherBlueprint.findUnique({
      where: {
        grade_subject_publisher: {
          grade,
          subject,
          publisher,
        },
      },
    });

    // Blueprint가 없으면 동아출판사 기본값 시도
    const finalBlueprint =
      blueprint ||
      (await prisma.publisherBlueprint.findUnique({
        where: {
          grade_subject_publisher: {
            grade,
            subject,
            publisher: DEFAULT_PUBLISHER,
          },
        },
      }));

    return NextResponse.json({
      map: {
        schoolId: map.schoolId,
        schoolName: map.school.name,
        grade: map.grade,
        subject: map.subject,
        publisher: publisher,
        year: map.year,
      },
      blueprint: finalBlueprint
        ? {
            styleJson: JSON.parse(finalBlueprint.styleJson || "{}"),
          }
        : null,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message ?? "Failed to fetch textbook map" },
      { status: 500 }
    );
  }
}

