"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
}

interface BottomNavProps {
  items?: NavItem[];
  showPlusButton?: boolean;
  onPlusClick?: () => void;
}

const DEFAULT_NAV_ITEMS: NavItem[] = [
  { href: "/", label: "홈", icon: "🏠" },
  { href: "/search", label: "검색", icon: "🔍" },
  { href: "/leaderboard", label: "리더보드", icon: "🏆" },
  { href: "/profile", label: "프로필", icon: "👤" },
];

/**
 * 하단 네비게이션 바 (홈/검색/리더보드/프로필 + 가운데 플러스 버튼)
 */
export default function BottomNav({
  items = DEFAULT_NAV_ITEMS,
  showPlusButton = true,
  onPlusClick,
}: BottomNavProps) {
  const pathname = usePathname();

  return (
    <div className="glass-card border-t border-white/20 px-4 py-2">
      <div className="max-w-md mx-auto flex items-center justify-around relative">
        {/* 네비게이션 아이템들 */}
        {items.map((item, index) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`
                flex flex-col items-center justify-center gap-1 px-4 py-2 rounded-xl
                transition-all duration-200
                ${
                  isActive
                    ? "text-white bg-white/20"
                    : "text-white/70 hover:text-white hover:bg-white/10"
                }
              `}
            >
              <span className="text-2xl">{item.icon}</span>
              <span className="text-xs font-medium">{item.label}</span>
            </Link>
          );
        })}

        {/* 가운데 플러스 버튼 (선택적) */}
        {showPlusButton && (
          <button
            onClick={onPlusClick}
            className="
              absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2
              w-14 h-14 rounded-full
              bg-gradient-to-br from-queezy-500 to-queezy-600
              text-white text-2xl font-bold
              shadow-purple-lg
              hover:shadow-purple-lg hover:scale-110
              active:scale-95
              transition-all duration-200
              flex items-center justify-center
            "
          >
            +
          </button>
        )}
      </div>
    </div>
  );
}

