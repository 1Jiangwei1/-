import { prisma } from "@/lib/prisma";
import { WorldList } from "@/components/world/world-list";

export default async function WorldPage({ searchParams }: { searchParams: Promise<{ q?: string; category?: string }> }) {
  const { q = "", category = "" } = await searchParams;
  const items = await prisma.loreEntry.findMany({
    where: {
      AND: [
        q ? { OR: [{ title: { contains: q, mode: "insensitive" } }, { summary: { contains: q, mode: "insensitive" } }] } : {},
        category ? { category } : {},
      ],
    },
    orderBy: { updatedAt: "desc" },
  });

  const categories = await prisma.loreEntry.findMany({ distinct: ["category"], select: { category: true } });

  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-bold">世界观资料库</h1>
      <form className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        <input name="q" defaultValue={q} placeholder="搜索词条" />
        <select name="category" defaultValue={category}>
          <option value="">全部分类</option>
          {categories.map((c) => (
            <option key={c.category} value={c.category}>{c.category}</option>
          ))}
        </select>
        <button className="rounded-md bg-accent px-4 py-2 text-black">筛选</button>
      </form>
      <WorldList items={items} />
    </section>
  );
}
