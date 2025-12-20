"use client";

import { ReactNode } from "react";

interface StatPillProps {
  label: string;
  value: string | number;
  icon?: ReactNode;
  variant?: "default" | "success" | "warning" | "error";
  className?: string;
}

/**
 * 작은 상태 pill 컴포넌트
 */
export default function StatPill({
  label,
  value,
  icon,
  variant = "default",
  className = "",
}: StatPillProps) {
  const variantStyles = {
    default: "bg-white/10 text-white border-white/20",
    success: "bg-green-500/20 text-green-300 border-green-500/30",
    warning: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
    error: "bg-red-500/20 text-red-300 border-red-500/30",
  };

  return (
    <div
      className={`
        inline-flex items-center gap-2
        px-3 py-1.5 rounded-full
        border backdrop-blur-sm
        text-sm font-medium
        ${variantStyles[variant]}
        ${className}
      `}
    >
      {icon && <span className="text-base">{icon}</span>}
      <span className="opacity-80">{label}:</span>
      <span className="font-bold">{value}</span>
    </div>
  );
}

