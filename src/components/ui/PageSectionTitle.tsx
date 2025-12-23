"use client";

import React from "react";

export function PageSectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="px-5 pt-6 mb-4">
      <h2 className="text-[#6F66D9] font-semibold text-lg tracking-tight">
        {children}
      </h2>
    </div>
  );
}


