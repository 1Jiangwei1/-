import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q") ?? "";
  const category = req.nextUrl.searchParams.get("category") ?? "";
  const items = await prisma.loreEntry.findMany({
    where: {
      AND: [
        q ? { OR: [{ title: { contains: q, mode: "insensitive" } }, { summary: { contains: q, mode: "insensitive" } }] } : {},
        category ? { category } : {},
      ],
    },
    orderBy: { updatedAt: "desc" },
    take: 100,
  });
  return NextResponse.json({ items });
}
