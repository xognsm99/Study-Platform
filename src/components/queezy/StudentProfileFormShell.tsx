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
    <div className="px-4 pt-4 pb-24 max-[380px]:px-3 max-[380px]:pt-3">
      <div className="mx-auto w-full max-w-md">
        {/* 헤더(타이틀 영역) */}
        <div className="px-1 pt-3 max-[380px]:pt-2">
          <h1 className="text-lg font-semibold text-[#6E63D5] max-[380px]:text-base">
            {title}
          </h1>
        </div>

        {/* 카드 */}
        <div className="mt-4 rounded-[28px] bg-white p-5 shadow-sm max-[380px]:mt-3 max-[380px]:p-4">
          {children}
        </div>

        {/* 하단 안내문 */}
        <p className="mt-3 text-center text-xs text-gray-600 max-[380px]:text-[11px]">
          ※ 프로필은 언제든 수정할 수 있어요.
        </p>
      </div>
    </div>
  );
}

