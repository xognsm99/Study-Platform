import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * 기존 DB의 모든 SchoolTextbookMap의 publisher를 "동아출판사"로 업데이트
 * 실행: npx tsx prisma/scripts/update-all-publishers.ts
 */
async function main() {
  console.log("🔄 Updating all publishers to '동아출판사'...");

  try {
    // 모든 SchoolTextbookMap의 publisher를 동아출판사로 업데이트
    const result = await prisma.schoolTextbookMap.updateMany({
      data: {
        publisher: "동아출판사",
      },
    });

    console.log(`✅ Updated ${result.count} SchoolTextbookMap records`);

    // 중3에만 있고 중1/중2가 없는 경우 복제
    console.log("🔄 Creating missing 중1/중2 mappings from 중3...");
    
    const allSchools = await prisma.school.findMany();
    let createdCount = 0;

    for (const school of allSchools) {
      // 중3 영어 데이터 찾기
      const middle3Map = await prisma.schoolTextbookMap.findUnique({
        where: {
          schoolId_grade_subject: {
            schoolId: school.id,
            grade: "중3",
            subject: "영어",
          },
        },
      });

      if (middle3Map) {
        // 중1, 중2가 없으면 생성
        for (const grade of ["중1", "중2"]) {
          const existing = await prisma.schoolTextbookMap.findUnique({
            where: {
              schoolId_grade_subject: {
                schoolId: school.id,
                grade,
                subject: "영어",
              },
            },
          });

          if (!existing) {
            await prisma.schoolTextbookMap.create({
              data: {
                schoolId: school.id,
                grade,
                subject: "영어",
                publisher: "동아출판사",
                year: middle3Map.year || 2024,
              },
            });
            createdCount++;
          }
        }
      }
    }

    console.log(`✅ Created ${createdCount} missing 중1/중2 mappings`);

    // PublisherBlueprint도 동아출판사로 업데이트
    const blueprintResult = await prisma.publisherBlueprint.updateMany({
      where: {
        publisher: {
          in: ["동아", "천재", "비상", "YBM", "능률"],
        },
        subject: "영어",
      },
      data: {
        publisher: "동아출판사",
      },
    });

    console.log(`✅ Updated ${blueprintResult.count} PublisherBlueprint records`);

    // 중1, 중2 PublisherBlueprint 생성 (없는 경우)
    console.log("🔄 Creating missing 중1/중2 PublisherBlueprints...");
    const blueprintGrades = ["중1", "중2", "중3"];
    let blueprintCreatedCount = 0;

    for (const grade of blueprintGrades) {
      const existing = await prisma.publisherBlueprint.findUnique({
        where: {
          grade_subject_publisher: {
            grade,
            subject: "영어",
            publisher: "동아출판사",
          },
        },
      });

      if (!existing) {
        await prisma.publisherBlueprint.create({
          data: {
            grade,
            subject: "영어",
            publisher: "동아출판사",
            styleJson: JSON.stringify({
              mix: { vocab: 20, grammar: 25, reading: 40, writing: 15 },
              difficulty: { low: 40, mid: 40, high: 20 },
              tone: "Korean school exam",
              avoid: ["US SAT style", "too open-ended prompts"],
            }),
          },
        });
        blueprintCreatedCount++;
      }
    }

    console.log(`✅ Created ${blueprintCreatedCount} missing PublisherBlueprints`);

    // 중복 제거: 동일한 grade, subject, publisher 조합이 여러 개 있을 수 있으므로
    // 유니크 제약 조건을 유지하기 위해 중복 체크 후 삭제
    const duplicates = await prisma.publisherBlueprint.groupBy({
      by: ["grade", "subject", "publisher"],
      having: {
        id: {
          _count: {
            gt: 1,
          },
        },
      },
    });

    if (duplicates.length > 0) {
      console.log(`⚠️  Found ${duplicates.length} duplicate blueprint groups`);
      // 각 그룹에서 첫 번째 것만 남기고 나머지 삭제
      for (const dup of duplicates) {
        const records = await prisma.publisherBlueprint.findMany({
          where: {
            grade: dup.grade,
            subject: dup.subject,
            publisher: dup.publisher,
          },
          orderBy: {
            createdAt: "asc",
          },
        });

        // 첫 번째 레코드 제외하고 삭제
        if (records.length > 1) {
          const idsToDelete = records.slice(1).map((r) => r.id);
          await prisma.publisherBlueprint.deleteMany({
            where: {
              id: {
                in: idsToDelete,
              },
            },
          });
          console.log(`   Deleted ${idsToDelete.length} duplicate blueprints for ${dup.grade}/${dup.subject}/${dup.publisher}`);
        }
      }
    }

    console.log("✅ All publishers updated to '동아출판사'!");
  } catch (error) {
    console.error("❌ Error updating publishers:", error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error("❌ Script failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
