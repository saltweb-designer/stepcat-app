"use client";

import { usePathname } from "next/navigation";
import AddEntryBar from "./AddEntryBar";
import BottomNav from "./BottomNav";

/** ノート・動画・音楽画面では、日記用の新規追加バー（予定・タスク等）を隠す。それぞれの追加ボタンはページ内にある */
export default function AppChrome() {
  const pathname = usePathname();
  const hideAddEntryBar = pathname.startsWith("/notes") || pathname.startsWith("/videos") || pathname.startsWith("/music") || pathname.startsWith("/training");

  return (
    <div className="relative z-40 flex shrink-0 flex-col shadow-[0_-2px_12px_rgba(0,0,0,0.08)]">
      {!hideAddEntryBar && <AddEntryBar />}
      <BottomNav />
    </div>
  );
}
