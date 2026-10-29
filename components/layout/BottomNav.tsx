"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarDays, Dumbbell, Home, MonitorPlay, Music, NotebookPen } from "lucide-react";

const tabs = [
  { href: "/", label: "ホーム", icon: Home },
  { href: "/music", label: "音楽", icon: Music },
  { href: "/videos", label: "動画", icon: MonitorPlay },
  { href: "/training", label: "筋トレ", icon: Dumbbell },
  { href: "/calendar", label: "予定", icon: CalendarDays },
  { href: "/notes", label: "メモ", icon: NotebookPen },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="flex items-stretch border-t border-gray-200 bg-white"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      {tabs.map(({ href, label, icon: Icon }) => {
        const isActive = href === "/" ? pathname === "/" : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            className={`flex flex-1 flex-col items-center justify-center gap-0.5 py-2.5 text-[11px] font-semibold transition-colors ${
              isActive ? "text-black" : "text-gray-400 hover:text-gray-600"
            }`}
          >
            <Icon className="h-5 w-5" strokeWidth={isActive ? 2.5 : 2} />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
