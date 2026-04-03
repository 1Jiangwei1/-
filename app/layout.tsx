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
];

export default async function RootLayout({ children }: { children: ReactNode }) {
  const user = await getCurrentUser();

  return (
    <html lang="zh-CN">
      <body className="overflow-x-hidden">
        {user ? <ActivityBeacon /> : null}
        <div className="min-h-screen">
          <header className="sticky top-0 z-40 border-b border-[rgba(118,137,129,0.14)] bg-[rgba(17,23,22,0.82)] backdrop-blur-xl">
            <div className="container-mobile">
              <div className="flex flex-col gap-3 py-4">
                <div className="flex items-start justify-between gap-3">
                  <Link href="/" className="min-w-0 flex-1 pr-2">
                    <div className="min-w-0">
                      <p className="text-[13px] font-semibold leading-[1.05] text-stone-100 sm:text-[1.02rem]">
                        <span className="block">玄鉴仙族</span>
                        <span className="mt-1 block">社区</span>
                      </p>
                    </div>
                  </Link>
                  <div className="shrink-0">
                    <UserNav user={user ? { username: user.username } : null} />
                  </div>
                </div>

                <nav className="flex gap-2 overflow-x-auto pb-1 text-sm whitespace-nowrap [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                  {NAV_ITEMS.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="shrink-0 rounded-full border border-[rgba(118,137,129,0.14)] bg-[rgba(24,30,29,0.62)] px-4 py-2 text-[#cfd4ca] transition hover:border-[rgba(177,145,87,0.18)] hover:bg-[rgba(29,35,34,0.82)] hover:text-white"
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
