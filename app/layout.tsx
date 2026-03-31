import "./globals.css";
import Link from "next/link";
import type { ReactNode } from "react";
import type { Route } from "next";

import ActivityBeacon from "@/components/auth/activity-beacon";
import UserNav from "@/components/auth/user-nav";
import { getCurrentUser } from "@/lib/auth/current-user";

const NAV_ITEMS: ReadonlyArray<{ href: Route; label: string }> = [
  { href: "/", label: "首页" },
  { href: "/world", label: "世界观" },
  { href: "/community", label: "讨论区" },
  { href: "/rank", label: "战力榜" },
  { href: "/admin/lore", label: "后台" },
];

export default async function RootLayout({ children }: { children: ReactNode }) {
  const user = await getCurrentUser();

  return (
    <html lang="zh-CN">
      <body>
        {user ? <ActivityBeacon /> : null}
        <div className="min-h-screen">
          <header className="sticky top-0 z-40 border-b border-[rgba(118,137,129,0.14)] bg-[rgba(17,23,22,0.82)] backdrop-blur-xl">
            <div className="container-mobile">
              <div className="flex flex-col gap-4 py-4">
                <div className="flex items-center justify-between gap-4">
                  <Link href="/" className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-[rgba(177,145,87,0.18)] bg-[rgba(177,145,87,0.08)] text-sm font-semibold text-[#dcc58f]">
                      玄鉴
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs section-kicker">Xuanjian Archive</p>
                      <p className="text-base font-semibold text-stone-100">玄鉴仙族社区</p>
                    </div>
                  </Link>
                  <UserNav user={user ? { username: user.username } : null} />
                </div>

                <nav className="flex gap-2 overflow-x-auto pb-1 text-sm whitespace-nowrap">
                  {NAV_ITEMS.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="rounded-full border border-[rgba(118,137,129,0.16)] bg-[rgba(24,30,29,0.7)] px-4 py-2 text-[#cfd4ca] transition hover:border-[rgba(177,145,87,0.18)] hover:bg-[rgba(29,35,34,0.82)] hover:text-white"
                    >
                      {item.label}
                    </Link>
                  ))}
                </nav>
              </div>
            </div>
          </header>

          <main className="container-mobile page-shell">{children}</main>
        </div>
      </body>
    </html>
  );
}
