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

          return (
            <Link
              key={it.key}
              href={it.href}
              className={[
                "relative flex w-16 flex-col items-center justify-center gap-1 rounded-xl px-2 py-2 transition-all duration-300",
                it.active ? "" : "text-gray-400 hover:text-gray-600",
              ].join(" ")}
              aria-current={it.active ? "page" : undefined}
              style={
                it.active
                  ? {
                      background: "linear-gradient(145deg, #1e40af 0%, #1e3a8a 50%, #172554 100%)",
                      boxShadow: "0 4px 16px -2px rgba(30,64,175,0.4), 0 0 0 1px rgba(255,255,255,0.1) inset",
                      color: "white",
                    }
                  : undefined
              }
            >
              {it.active && (
                <>
                  {/* 상단 글로우 효과 */}
                  <div
                    className="absolute top-0 left-0 right-0 h-[40%] opacity-40 pointer-events-none rounded-t-xl"
                    style={{
                      background: "linear-gradient(to bottom, rgba(255,255,255,0.25), transparent)",
                    }}
                  />
                  {/* 미세한 반짝임 */}
                  <div
                    className="absolute inset-0 opacity-10 pointer-events-none rounded-xl"
                    style={{
                      background: `
                        radial-gradient(circle at 30% 20%, rgba(255,255,255,0.6) 0, transparent 2px),
                        radial-gradient(circle at 70% 30%, rgba(255,255,255,0.5) 0, transparent 1.5px)
                      `,
                    }}
                  />
                </>
              )}
              <Icon className="relative z-10 text-current" strokeWidth={1.8} size={22} />
              <span className="relative z-10 text-[11px] font-medium">{it.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
