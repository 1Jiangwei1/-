import "./globals.css";
import Link from "next/link";
import type { ReactNode } from "react";

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="zh-CN">
      <body>
        <header className="border-b border-border bg-card/80 backdrop-blur">
          <div className="container-mobile flex items-center justify-between py-3">
            <Link href="/world" className="text-lg font-semibold text-accent">
              玄鉴仙族
            </Link>
            <nav className="flex gap-4 text-sm text-muted">
              <Link href="/world">世界观</Link>
              <Link href="/admin/lore">管理台</Link>
              <Link href="/auth/login">登录</Link>
            </nav>
          </div>
        </header>
        <main className="container-mobile py-6">{children}</main>
      </body>
    </html>
  );
}
