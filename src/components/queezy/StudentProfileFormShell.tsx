"use client";

import React from "react";

type Props = {
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
};

export default function StudentProfileFormShell({
  title = "프로필 설정",
  subtitle = "학교/학년/과목을 설정해요",
  children,
}: Props) {
  return (
    <div className="min-h-[calc(100vh-56px)] bg-[#F6F5FF]">
      {/* Purple header */}
      <div className="relative overflow-hidden bg-gradient-to-b from-[#6E63D5] to-[#8B7EF0]">
        {/* decorative blobs */}
        <div className="pointer-events-none absolute -top-24 -left-24 h-64 w-64 rounded-full bg-white/15 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-24 -right-24 h-72 w-72 rounded-full bg-white/10 blur-2xl" />

        <div className="mx-auto max-w-3xl px-4 pb-14 pt-10">
          <div className="text-white">
            <div className="text-sm/6 opacity-90">{subtitle}</div>
            <div className="mt-1 text-2xl font-extrabold tracking-tight">{title}</div>
          </div>
        </div>
      </div>

      {/* Card */}
      <div className="mx-auto -mt-4 max-w-3xl px-4 pb-12">
        <div className="rounded-[28px] bg-white/95 p-6 shadow-[0_20px_60px_rgba(46,33,125,0.25)] backdrop-blur">
          {children}
        </div>

        <div className="mt-4 text-center text-xs text-[#6E63D5]/80">
          ※ 프로필은 언제든 수정할 수 있어요.
        </div>
      </div>
    </div>
  );
}

