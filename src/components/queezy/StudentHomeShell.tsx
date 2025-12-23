"use client";

import React from "react";

export default function StudentHomeShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="px-4 pt-4 pb-24 max-[380px]:px-3 max-[380px]:pt-3 overflow-x-hidden">
      <div className="mx-auto w-full max-w-md">
        {children}
      </div>
    </div>
  );
}
