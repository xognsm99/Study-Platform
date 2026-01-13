"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, BookOpen, FileText, Users, Settings } from "lucide-react";

function getLocale(pathname: string) {
  const seg = pathname.split("/")[1];
  return seg === "ko" || seg === "en" ? seg : null;
}

export default function BottomNav() {
  const pathname = usePathname();
  const locale = getLocale(pathname);
  const base = locale ? `/${locale}` : "";

  const hrefHome = `${base || "/"}`;
  const hrefQuiz = `${base}/student`;
  const hrefProblem = `${base}/student/problems`;
  const hrefTeacher = `${base}/teacher`;
  const hrefMy = `${base}/student/setup`;

  const activeHome = pathname === hrefHome;
  const activeQuiz = pathname === hrefQuiz;
  const activeProblem = pathname.startsWith(hrefProblem);
  const activeTeacher = pathname.startsWith(hrefTeacher);
  const activeMy = pathname.startsWith(hrefMy);

  // ✅ 학생 버튼 블루 그라데이션 + 3D 효과
  const ACTIVE_ITEM = "text-white bg-gradient-to-br from-[#1e40af] via-[#2563eb] to-[#3b82f6] shadow-[0_2px_8px_rgba(30,64,175,0.3)]";
  const INACTIVE_ITEM = "text-gray-400";

  const items = [
    { key: "home", href: hrefHome, label: "홈", Icon: Home, active: activeHome },
    { key: "quiz", href: hrefQuiz, label: "퀴즈", Icon: BookOpen, active: activeQuiz },
    { key: "problem", href: hrefProblem, label: "문제", Icon: FileText, active: activeProblem },
    { key: "teacher", href: hrefTeacher, label: "선생님", Icon: Users, active: activeTeacher },
    { key: "my", href: hrefMy, label: "마이", Icon: Settings, active: activeMy },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-white pb-[env(safe-area-inset-bottom)]">
      <div className="mx-auto flex h-16 max-w-md items-center justify-around">
        {items.map((it) => {
          const Icon = it.Icon;
          const itemCls = it.active ? ACTIVE_ITEM : INACTIVE_ITEM;

          return (
            <Link
              key={it.key}
              href={it.href}
              className={[
                "flex w-16 flex-col items-center justify-center gap-1 rounded-xl px-2 py-2 transition",
                itemCls,
              ].join(" ")}
              aria-current={it.active ? "page" : undefined}
            >
              <Icon className="text-current" strokeWidth={1.8} size={22} />
              <span className="text-[11px] font-medium">{it.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
