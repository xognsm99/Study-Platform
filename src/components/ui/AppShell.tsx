"use client";

import { ReactNode } from "react";

interface AppShellProps {
  children: ReactNode;
  header?: ReactNode;
  bottomNav?: ReactNode;
  className?: string;
}

/**
 * 앱 전체 레이아웃 셸 (상단 헤더 + 컨텐츠 + 하단 탭바)
 */
export default function AppShell({
  children,
  header,
  bottomNav,
  className = "",
}: AppShellProps) {
  return (
    <div className={`min-h-screen bg-queezy flex flex-col ${className}`}>
      {/* 상단 헤더 */}
      {header && (
        <header className="sticky top-0 z-50 glass-card border-b border-white/20">
          {header}
        </header>
      )}

      {/* 메인 컨텐츠 */}
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>

      {/* 하단 네비게이션 */}
      {bottomNav && (
        <nav className="sticky bottom-0 z-50">
          {bottomNav}
        </nav>
      )}
    </div>
  );
}

