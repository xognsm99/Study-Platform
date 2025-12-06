import SelectionGrid from "@/components/SelectionGrid";
import { GRADES } from "@/lib/utils/constants";

export default function StudentPage() {
  const items = GRADES.map((g) => ({
    key: g,
    label: g,
    enabled: true,
    href: `/student/${encodeURIComponent(g)}`,
  }));

  return (
    <SelectionGrid
      title="학년 선택"
      description="학년을 선택하세요"
      items={items}
      backHref="/"
    />
  );
}
