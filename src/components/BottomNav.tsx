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

  // 활성 탭 판별 (정확한 매칭)
  const activeHome = pathname === hrefHome;
  const activeQuiz = pathname === hrefQuiz; // exact match only
  const activeProblem = pathname.startsWith(hrefProblem);
  const activeTeacher = pathname.startsWith(hrefTeacher);
  const activeMy = pathname.startsWith(hrefMy);

  const ACTIVE = "text-[#6E63D5]";
  const INACTIVE = "text-gray-400";

  const items = [
    { 
      key: "home", 
      href: hrefHome, 
      label: "홈", 
      Icon: Home, 
      active: activeHome 
    },
    { 
      key: "quiz", 
      href: hrefQuiz, 
      label: "퀴즈", 
      Icon: BookOpen, 
      active: activeQuiz 
    },
    { 
      key: "problem", 
      href: hrefProblem, 
      label: "문제", 
      Icon: FileText, 
      active: activeProblem 
    },
    { 
      key: "teacher", 
      href: hrefTeacher, 
      label: "선생님", 
      Icon: Users, 
      active: activeTeacher 
    },
    { 
      key: "my", 
      href: hrefMy, 
      label: "마이", 
      Icon: Settings, 
      active: activeMy 
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-white pb-[env(safe-area-inset-bottom)]">
      <div className="mx-auto flex h-16 max-w-md items-center justify-around">
        {items.map((it) => {
          const Icon = it.Icon;
          return (
            <Link
              key={it.key}
              href={it.href}
              className="flex w-16 flex-col items-center justify-center gap-1"
              aria-current={it.active ? "page" : undefined}
            >
              <Icon
                className={it.active ? ACTIVE : INACTIVE}
                strokeWidth={1.8}
                size={22}
              />
              <span className={`text-[11px] ${it.active ? ACTIVE : INACTIVE}`}>
                {it.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
