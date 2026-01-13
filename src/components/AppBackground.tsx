import React from "react";

export default function AppBackground({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="relative min-h-dvh bg-sky-50 dark:bg-sky-50"
    >
      {children}
    </div>
  );
}

