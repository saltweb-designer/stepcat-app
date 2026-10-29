"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MonitorPlay, Music } from "lucide-react";

const links = [
  { href: "/videos", label: "動画", icon: MonitorPlay },
  { href: "/music", label: "音楽", icon: Music },
];

/** ヘッダー右側の動画・音楽ページへのアイコンリンク。文字は出さずアイコンだけにする */
export default function HeaderNavIcons() {
  const pathname = usePathname();

  return (
    <nav className="flex shrink-0 items-center gap-0.5 sm:gap-1">
      {links.map(({ href, label, icon: Icon }) => {
        const active = pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            title={label}
            aria-label={label}
            aria-current={active ? "page" : undefined}
            className={`flex h-8 w-8 items-center justify-center rounded-full transition-colors sm:h-9 sm:w-9 ${
              active ? "bg-gray-900 text-white" : "text-gray-500 hover:bg-gray-100 hover:text-gray-800"
            }`}
          >
            <Icon className="h-[18px] w-[18px] sm:h-5 sm:w-5" strokeWidth={2} />
          </Link>
        );
      })}
    </nav>
  );
}
