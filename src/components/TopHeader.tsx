"use client";

import { useRouter, usePathname } from "next/navigation";

export default function TopHeader() {
  const router = useRouter();
  const pathname = usePathname();
  const locale = pathname?.split("/")[1] || "ko";

  // student 또는 teacher 페이지에서 보이도록
  const isStudentPage = pathname?.includes("/student");
  const isTeacherPage = pathname?.includes("/teacher");

  if (!isStudentPage && !isTeacherPage) return null;

  // student 페이지면 /student?edit=true, teacher 페이지면 /teacher?edit=true
  const profileRoute = isTeacherPage ? `/${locale}/teacher?edit=true` : `/${locale}/student?edit=true`;

  return (
    <div className="sticky top-0 z-50 bg-white/90 backdrop-blur-sm border-b border-gray-200">
      <div className="max-w-[520px] mx-auto px-4 h-14 flex items-center justify-end">
        <button
          onClick={() => router.push(profileRoute)}
          className="rounded-full border border-blue-300 bg-blue-100 px-4 py-1.5 text-sm font-semibold text-blue-900 hover:bg-blue-200 transition-colors"
        >
          프로필
        </button>
      </div>
    </div>
  );
}
