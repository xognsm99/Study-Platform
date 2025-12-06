"use client";

import Link from "next/link";

type Item = {
  key: string;
  label: string;
  enabled?: boolean;
  href?: string;
};

type Props = {
  title: string;
  description?: string;
  items: Item[];
  backHref?: string;
};

export default function SelectionGrid({
  title,
  description,
  items,
  backHref,
}: Props) {
  return (
    <div className="mx-auto max-w-4xl p-6 text-gray-900">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">{title}</h1>
        {description ? (
          <p className="mt-1 text-sm text-gray-600">{description}</p>
        ) : null}
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3">
        {items.map((it) => {
          const disabled = it.enabled === false || !it.href;

          const cardClass =
            "rounded-2xl border bg-white p-5 shadow-sm text-sm font-semibold " +
            (disabled ? "opacity-40 cursor-not-allowed" : "hover:bg-gray-50");

          const card = <div className={cardClass}>{it.label}</div>;

          // ✅ href가 없거나 disabled면 링크 없이 렌더
          if (disabled) {
            return <div key={it.key}>{card}</div>;
          }

          // ✅ 여기부터는 href가 확실히 string
          const href = it.href as string;

          return (
            <Link key={it.key} href={href}>
              {card}
            </Link>
          );
        })}
      </div>

      {backHref ? (
        <div className="mt-6">
          <Link
            href={backHref}
            className="text-sm text-blue-600 hover:underline"
          >
            ← 뒤로
          </Link>
        </div>
      ) : null}
    </div>
  );
}
