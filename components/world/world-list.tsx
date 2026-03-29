import Link from "next/link";
import { Card } from "@/components/ui/card";

interface LoreItem {
  id: string;
  slug: string;
  title: string;
  summary: string | null;
  category: string;
}

export function WorldList({ items }: { items: LoreItem[] }) {
  return (
    <div className="space-y-3">
      {items.map((item) => (
        <Card key={item.id}>
          <div className="mb-1 text-xs uppercase tracking-wider text-accent">{item.category}</div>
          <Link href={`/world/${item.slug}`} className="text-lg font-semibold hover:text-accent">
            {item.title}
          </Link>
          <p className="mt-2 text-sm text-muted">{item.summary ?? "暂无摘要"}</p>
        </Card>
      ))}
    </div>
  );
}
