"use client";

import Link from "next/link";

export default function Header() {
  return (
    <header className="border-b bg-white">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-3">
        {/* ✅ 앱 이름 */}
        <Link href="/" className="text-base font-semibold text-slate-900">
          스터디 플랫폼
        </Link>

        {/* ✅ 우측 메뉴 (일단 기능 없어도 보이게만) */}
        <div className="flex items-center gap-3 text-sm text-slate-600">
          <Link href="/student" className="hover:text-slate-900">
            학생
          </Link>
          <Link href="/auth" className="hover:text-slate-900">
            로그인
          </Link>
        </div>
      </div>
    </header>
  );
}
