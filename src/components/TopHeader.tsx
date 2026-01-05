"use client";

import { useRouter, usePathname } from "next/navigation";

export default function TopHeader() {
  const router = useRouter();
  const pathname = usePathname();
  const locale = pathname?.split("/")[1] || "ko";

  // student 페이지에서만 보이도록
  const isStudentPage = pathname?.includes("/student");

  if (!isStudentPage) return null;

  return (
    <div className="sticky top-0 z-50 bg-violet-100/90 backdrop-blur-sm border-b border-violet-200">
      <div className="max-w-[520px] mx-auto px-4 h-14 flex items-center justify-end">
        <button
          onClick={() => router.push(`/${locale}/student?edit=true`)}
          className="rounded-full border border-violet-300 bg-violet-100 px-4 py-1.5 text-sm font-semibold text-slate-700 hover:bg-violet-200 transition-colors"
        >
          프로필
        </button>
      </div>
    </div>
  );
}
