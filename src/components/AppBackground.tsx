import React from "react";

export default function AppBackground({ children }: { children: React.ReactNode }) {
  return (
    <div 
      className="relative min-h-dvh bg-gradient-to-b from-violet-200 via-violet-100 to-violet-50"
      style={{ backgroundColor: '#f5f3ff' }} // 기본 배경색 (violet-100) - 초기 렌더링 시 플래시 방지
    >
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-violet-200/20" />
      {children}
    </div>
  );
}

