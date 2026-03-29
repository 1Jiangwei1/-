import { Card } from "@/components/ui/card";

export function ChangeRequestsList({
  items,
}: {
  items: Array<{ id: string; status: string; createdAt: Date; requester: { username: string }; entry: { title: string } }>;
}) {
  return (
    <div className="space-y-3">
      {items.map((item) => (
        <Card key={item.id}>
          <p className="text-sm text-muted">#{item.id.slice(0, 8)} · {item.requester.username}</p>
          <p className="font-medium">{item.entry.title}</p>
          <p className="text-xs text-accent">{item.status}</p>
        </Card>
      ))}
    </div>
  );
}
