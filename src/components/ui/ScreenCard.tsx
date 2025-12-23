import React from "react";

export function ScreenCard({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={
        "w-full max-w-[520px] mx-auto rounded-[28px] bg-white/92 " +
        "shadow-[0_18px_50px_rgba(55,45,120,0.18)] ring-1 ring-white/60 " +
        "p-6 max-[380px]:p-5 " +
        className
      }
    >
      {children}
    </div>
  );
}

export function ScreenTitle({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={
        "w-full max-w-[520px] mx-auto mb-3 " +
        "text-left font-extrabold tracking-tight " +
        "text-[18px] text-[#6E63D5] " +
        className
      }
    >
      {children}
    </div>
  );
}


