"use client";

import React from "react";

type Props = {
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
};

export default function StudentProfileFormShell({
  title = "학생 프로필",
  subtitle = "내신 준비, 게임처럼 쉽게",
  children,
}: Props) {
  return (
    <div className="px-4 pt-4 pb-24 max-[380px]:px-3 max-[380px]:pt-3 md:px-6 md:pt-6 lg:px-8">
      {/* 모바일: max-w-md, 태블릿: max-w-xl, PC: max-w-2xl */}
      <div className="mx-auto w-full max-w-md md:max-w-xl lg:max-w-2xl">
        {/* 헤더(타이틀 영역) */}
        <div className="px-1 pt-3 max-[380px]:pt-2">
          <h1 className="text-lg font-semibold text-[#2563eb] max-[380px]:text-base md:text-xl lg:text-2xl">
            {title}
          </h1>
        </div>

        {/* 카드 */}
        <div className="mt-4 rounded-[28px] bg-white p-5 shadow-sm max-[380px]:mt-3 max-[380px]:p-4 md:p-8 lg:p-10">
          {children}
        </div>

        {/* 하단 안내문 */}
        <p className="mt-3 text-center text-xs text-gray-600 max-[380px]:text-[11px] md:text-sm">
          ※ 프로필은 언제든 수정할 수 있어요.
        </p>
      </div>
    </div>
  );
}

