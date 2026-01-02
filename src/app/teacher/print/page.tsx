import { redirect } from "next/navigation";

export default function TeacherPrintRedirect({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(searchParams)) {
    if (typeof v === "string") qs.set(k, v);
  }
  redirect(`/ko/teacher/print?${qs.toString()}`);
}
