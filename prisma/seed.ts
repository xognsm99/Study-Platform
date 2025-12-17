import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // 1. Region 생성
  const region = await prisma.region.upsert({
    where: { id: "region-gyeongsang" },
    update: {},
    create: {
      id: "region-gyeongsang",
      name: "경상",
    },
  });

  // 2. Province 생성
  const province = await prisma.province.upsert({
    where: { id: "province-gyeongnam" },
    update: {},
    create: {
      id: "province-gyeongnam",
      name: "경상남도",
      regionId: region.id,
    },
  });

  // 3. Cities 생성
  const gimhaeCity = await prisma.city.upsert({
    where: { id: "city-gimhae" },
    update: {},
    create: {
      id: "city-gimhae",
      name: "김해시",
      provinceId: province.id,
    },
  });

  const changwonCity = await prisma.city.upsert({
    where: { id: "city-changwon" },
    update: {},
    create: {
      id: "city-changwon",
      name: "창원시",
      provinceId: province.id,
    },
  });

  // 4. Schools 생성
  // 김해시 지역별 학교 그룹
  const GIMHAE_JANGYU_AREA = [
    "관동중학교",
    "김해모산중학교",
    "내덕중학교",
    "능동중학교",
    "대청중학교",
    "수남중학교",
    "월산중학교",
    "율하중학교",
    "장유중학교",
  ] as const;

  const GIMHAE_JINYEONG_AREA = [
    "진영장등중학교",
    "진영중학교",
    "한얼중학교",
  ] as const;

  const GIMHAE_MIDDLE_SCHOOLS = [
    "가야중학교",
    "경운중학교",
    "관동중학교",
    "구산중학교",
    "김해대곡중학교",
    "김해대동중학교",
    "김해모산중학교",
    "김해삼계중학교",
    "김해서중학교",
    "김해여자중학교",
    "김해중앙여자중학교",
    "김해중학교",
    "내덕중학교",
    "내동중학교",
    "능동중학교",
    "대청중학교",
    "봉명중학교",
    "분성중학교",
    "삼정중학교",
    "생림중학교",
    "수남중학교",
    "신어중학교",
    "영운중학교",
    "월산중학교",
    "율하중학교",
    "임호중학교",
    "장유중학교",
    "진례중학교",
    "진영장등중학교",
    "진영중학교",
    "한림중학교",
    "한얼중학교",
    "활천중학교",
  ] as const;

  const CHANGWON_MIDDLE_SCHOOLS = [
    "감계중학교",
    "경원중학교(창원)",
    "광려중학교",
    "구남중학교",
    "구암중학교",
    "남산중학교",
    "대방중학교(창원)",
    "대산중학교",
    "도계중학교",
    "동진여자중학교",
    "동진중학교",
    "마산내서중학교",
    "마산동중학교",
    "마산무학여자중학교",
    "마산삼계중학교",
    "마산삼진중학교",
    "마산서중학교",
    "마산여자중학교",
    "마산의신여자중학교",
    "마산제일여자중학교",
    "마산중앙중학교",
    "마산중학교",
    "마산호계중학교",
    "명곡여자중학교",
    "명서중학교",
    "반림중학교",
    "반송중학교",
    "봉곡중학교",
    "봉림중학교",
    "사파중학교",
    "삼정자중학교",
    "석동중학교",
    "성지여자중학교",
    "신월중학교(창원)",
    "안골포중학교",
    "안남중학교",
    "안민중학교",
    "양곡중학교",
    "양덕여자중학교",
    "양덕중학교",
    "용원중학교",
    "웅남중학교",
    "웅동중학교",
    "진전중학교",
    "진해남중학교",
    "진해여자중학교",
    "진해중학교",
    "창덕중학교",
    "창북중학교",
    "창신중학교",
    "창원남중학교",
    "창원동중학교",
    "창원상남중학교",
    "창원여자중학교",
    "창원중앙중학교",
    "창원중학교",
    "토월중학교",
    "팔룡중학교",
    "합포여자중학교",
    "합포중학교",
    "해운중학교",
  ] as const;

  // 김해시 학교들
  const gimhaeSchools = GIMHAE_MIDDLE_SCHOOLS.map((name) => ({
    name,
    cityId: gimhaeCity.id,
  }));

  // 창원시 학교들
  const changwonSchools = CHANGWON_MIDDLE_SCHOOLS.map((name) => ({
    name,
    cityId: changwonCity.id,
  }));

  const allSchools = [...gimhaeSchools, ...changwonSchools];

  const createdSchools = [];
  for (const schoolData of allSchools) {
    const school = await prisma.school.upsert({
      where: { id: `school-${schoolData.name}` },
      update: {},
      create: {
        id: `school-${schoolData.name}`,
        name: schoolData.name,
        cityId: schoolData.cityId,
      },
    });
    createdSchools.push(school);
  }

  // 5. SchoolTextbookMap 생성 (중1, 중2, 중3 영어)
  // 모든 학교를 동아출판사로 통일
  const DEFAULT_PUBLISHER = "동아출판사";
  const GRADES = ["중1", "중2", "중3"];
  const SUBJECT = "영어";
  
  for (const school of createdSchools) {
    for (const grade of GRADES) {
      await prisma.schoolTextbookMap.upsert({
        where: {
          schoolId_grade_subject: {
            schoolId: school.id,
            grade,
            subject: SUBJECT,
          },
        },
        update: {
          publisher: DEFAULT_PUBLISHER,
        },
        create: {
          schoolId: school.id,
          grade,
          subject: SUBJECT,
          publisher: DEFAULT_PUBLISHER,
          year: 2024,
        },
      });
    }
  }

  // 6. PublisherBlueprint 생성 (중1, 중2, 중3 영어, 동아출판사만)
  const blueprintGrades = ["중1", "중2", "중3"];
  const blueprints = blueprintGrades.map((grade) => ({
    grade,
    subject: "영어",
    publisher: "동아출판사",
    styleJson: JSON.stringify({
      mix: { vocab: 20, grammar: 25, reading: 40, writing: 15 },
      difficulty: { low: 40, mid: 40, high: 20 },
      tone: "Korean school exam",
      avoid: ["US SAT style", "too open-ended prompts"],
    }),
  }));

  for (const blueprint of blueprints) {
    // Parse the styleJson string to get the style object
    const styleObj = JSON.parse(blueprint.styleJson);

    await prisma.publisherBlueprint.upsert({
      where: {
        grade_subject_publisher: {
          grade: blueprint.grade,
          subject: blueprint.subject,
          publisher: blueprint.publisher,
        },
      },
      update: {
        styleJson: JSON.stringify(styleObj),
      },
      create: {
        grade: blueprint.grade,
        subject: blueprint.subject,
        publisher: blueprint.publisher,
        styleJson: JSON.stringify(styleObj),
      },
    });
  }

  console.log("✅ Seeding completed!");
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

