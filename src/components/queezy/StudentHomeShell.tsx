"use client";

import React from "react";

export default function StudentHomeShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="px-4 pt-4 pb-24 max-[380px]:px-3 max-[380px]:pt-3 md:px-6 md:pt-6 lg:px-8 overflow-x-hidden">
      {/* 모바일: max-w-md, 태블릿: max-w-xl, PC: max-w-2xl */}
      <div className="mx-auto w-full max-w-md md:max-w-xl lg:max-w-2xl">
        {children}
      </div>
    </div>
  );
}
