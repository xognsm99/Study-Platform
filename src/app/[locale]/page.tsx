"use client";

import Link from "next/link";
import HomeWithIntro from "@/components/HomeWithIntro";
import { use } from "react";

export default function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = use(params);

  return (
    <HomeWithIntro locale={locale}>
      <div className="px-4 pt-4 pb-24 max-[380px]:px-3 max-[380px]:pt-3">
        <div className="mx-auto w-full max-w-md">
          <div className="px-1 pt-12 pb-8">
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
                className="font-semibold tracking-tight text-2xl sm:text-2xl leading-snug"
                style={{
                  color: "#24272D",
                }}
              >
                <span className="block">PICK 하고,</span>
                <span className="block">내신 점수 올리자</span>
              </h1>
              <p className="mt-3 text-2sm" style={{ color: "#82808aff" }}>
                학교 맞춤 문제 생성 어플
              </p>

              <div className="mt-8 grid grid-cols-2 gap-3">
                <Link
                  href={`/${locale}/student`}
                  className="group"
                  style={{
                    height: "55px",
                    borderRadius: "20px",
                    background: "#6A5AE0",
                    color: "#fff",
                    width: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "1.325rem",
                    fontWeight: 600,
                    textDecoration: "none",
                    transition: "all 0.2s ease-in-out",
                    userSelect: "none",
                    WebkitUserSelect: "none",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "#5B4ED4";
                    e.currentTarget.style.transform = "translateY(-2px)";
                    e.currentTarget.style.boxShadow = "0 8px 16px rgba(106, 90, 224, 0.3)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "#6A5AE0";
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow = "none";
                  }}
                  onMouseDown={(e) => {
                    e.currentTarget.style.transform = "translateY(0) scale(0.98)";
                  }}
                  onMouseUp={(e) => {
                    e.currentTarget.style.transform = "translateY(-2px) scale(1)";
                  }}
                >
                  학생
                </Link>

                <Link
                  href={`/${locale}/teacher`}
                  className="group"
                  style={{
                    height: "55px",
                    borderRadius: "20px",
                    background: "#E9E6FF",
                    color: "#6A5AE0",
                    width: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "1.325rem",
                    fontWeight: 600,
                    textDecoration: "none",
                    transition: "all 0.2s ease-in-out",
                    userSelect: "none",
                    WebkitUserSelect: "none",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "#D9D5F5";
                    e.currentTarget.style.transform = "translateY(-2px)";
                    e.currentTarget.style.boxShadow = "0 8px 16px rgba(106, 90, 224, 0.2)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "#E9E6FF";
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow = "none";
                  }}
                  onMouseDown={(e) => {
                    e.currentTarget.style.transform = "translateY(0) scale(0.98)";
                  }}
                  onMouseUp={(e) => {
                    e.currentTarget.style.transform = "translateY(-2px) scale(1)";
                  }}
                >
                  선생님
                </Link>
              </div>

              {/* 구독하기 버튼 */}
              <div className="mt-4">
                <Link
                  href="/plans"
                  className="group"
                  style={{
                    height: "55px",
                    borderRadius: "20px",
                    background: "#FFF",
                    border: "2px solid #6A5AE0",
                    color: "#6A5AE0",
                    width: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "1.225rem",
                    fontWeight: 600,
                    textDecoration: "none",
                    transition: "all 0.2s ease-in-out",
                    userSelect: "none",
                    WebkitUserSelect: "none",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "#F5F4FF";
                    e.currentTarget.style.borderColor = "#5B4ED4";
                    e.currentTarget.style.color = "#5B4ED4";
                    e.currentTarget.style.transform = "translateY(-2px)";
                    e.currentTarget.style.boxShadow = "0 8px 16px rgba(106, 90, 224, 0.15)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "#FFF";
                    e.currentTarget.style.borderColor = "#6A5AE0";
                    e.currentTarget.style.color = "#6A5AE0";
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow = "none";
                  }}
                  onMouseDown={(e) => {
                    e.currentTarget.style.transform = "translateY(0) scale(0.98)";
                  }}
                  onMouseUp={(e) => {
                    e.currentTarget.style.transform = "translateY(-2px) scale(1)";
                  }}
                >
                  요금제 보기
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

