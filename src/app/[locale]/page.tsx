import Link from "next/link";
import HomeWithIntro from "@/components/HomeWithIntro";

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  const btnBase =
    "w-full rounded-xl border border-gray-200 bg-white px-6 py-3 text-base font-semibold text-gray-900 shadow-sm " +
    "transition-colors hover:bg-blue-600 hover:text-white hover:border-blue-600 " +
    "focus:outline-none focus:ring-4 focus:ring-blue-200";

  return (
    <HomeWithIntro locale={locale}>
      <div className="px-4 pt-4 pb-24 max-[380px]:px-3 max-[380px]:pt-3">
        <div className="mx-auto w-full max-w-md">
          <div className="px-4 pt-12 pb-8">
            <div style={{
              borderRadius: "20px",
              background: "#FFFFFF",
              padding: "1.5rem",
              paddingTop: "1.75rem",
              paddingBottom: "1.75rem",
              boxShadow: "0 2px 8px rgba(0, 0, 0, 0.06)",
              margin: "0 auto"
            }}>
              <h1
                className="font-semibold tracking-tight text-xl sm:text-2xl leading-snug"
                style={{
                  color: "#24272D",
                }}
              >
                <span className="block">PICK 하고,</span>
                <span className="block">내신 점수 올리자</span>
              </h1>
              <p className="mt-3 text-sm" style={{ color: "#9D9BA8" }}>
                학교 맞춤 문제 생성 어플
              </p>

              <div className="mt-8 grid grid-cols-2 gap-3">
                <Link
                  href={`/${locale}/student`}
                  style={{
                    height: "48px",
                    borderRadius: "20px",
                    background: "#6A5AE0",
                    color: "#fff",
                    width: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "1.125rem",
                    fontWeight: 600,
                    textDecoration: "none",
                    transition: "all 0.2s",
                  }}
                >
                  학생
                </Link>

                <Link
                  href={`/${locale}/teacher`}
                  style={{
                    height: "48px",
                    borderRadius: "20px",
                    background: "#E9E6FF",
                    color: "#24272D",
                    width: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "1.125rem",
                    fontWeight: 600,
                    textDecoration: "none",
                    transition: "all 0.2s",
                  }}
                >
                  선생님
                </Link>
              </div>
              {/* TODO: 나중에 프로필 기반 기능(결제/프리셋 저장/기관 관리) 추가 시
                  역할 선택 후 프로필 확인/생성 단계 추가 가능 */}
            </div>
          </div>
        </div>
      </div>
    </HomeWithIntro>
  );
}

