import Link from "next/link";
import { Card } from "@/components/ui/card";

export function WorldDetail({
  entry,
  relations,
}: {
  entry: {
    title: string;
    summary: string | null;
    content: string | null;
    category: string;
    metas: Array<{ id: string; key: string; value: string }>;
  };
  relations: Array<{ slug: string; title: string; type: string }>;
}) {
  return (
    <div className="space-y-4">
      <Card>
        <div className="mb-2 text-xs text-accent">{entry.category}</div>
        <h1 className="text-2xl font-bold">{entry.title}</h1>
        <p className="mt-2 text-muted">{entry.summary}</p>
        <article className="prose prose-invert mt-4 whitespace-pre-wrap text-sm">{entry.content}</article>
      </Card>
      <Card>
        <h2 className="mb-2 text-lg font-semibold">扩展字段</h2>
        <ul className="space-y-1 text-sm text-muted">
          {entry.metas.length === 0 && <li>暂无扩展字段</li>}
          {entry.metas.map((m) => (
            <li key={m.id}>{m.key}: {m.value}</li>
          ))}
        </ul>
      </Card>
      <Card>
        <h2 className="mb-2 text-lg font-semibold">关联词条</h2>
        <ul className="space-y-1 text-sm">
          {relations.length === 0 && <li className="text-muted">暂无关联</li>}
          {relations.map((r) => (
            <li key={`${r.slug}-${r.type}`}>
              <Link href={`/world/${r.slug}`} className="text-accent">{r.title}</Link> <span className="text-muted">({r.type})</span>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
