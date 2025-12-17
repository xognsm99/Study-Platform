"use client";

import * as React from "react";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "default" | "outline";
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = "", variant = "default", ...props }, ref) => {
    const base =
      "inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition " +
      "disabled:opacity-50 disabled:pointer-events-none";

    const styles =
      variant === "outline"
        ? "border border-slate-300 bg-white text-slate-900 hover:bg-slate-50"
        : "bg-slate-900 text-white hover:bg-slate-800";

    return (
      <button
        ref={ref}
        className={`${base} ${styles} ${className}`}
        {...props}
      />
    );
  }
);

Button.displayName = "Button";
