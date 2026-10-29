"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

/**
 * ロゴのリンク。ホーム画面で押したときはページ遷移せず、スクロール枠を一番上までなめらかに戻す。
 * スクロールしているのは window ではなく layout.tsx の枠（data-scroll-root）なので、そちらを動かす
 */
export default function LogoLink({ className, children }: { className?: string; children: ReactNode }) {
  const pathname = usePathname();

  return (
    <Link
      href="/"
      className={className}
      onClick={(e) => {
        if (pathname !== "/") return;
        e.preventDefault();
        document.querySelector("[data-scroll-root]")?.scrollTo({ top: 0, behavior: "smooth" });
      }}
    >
      {children}
    </Link>
  );
}
