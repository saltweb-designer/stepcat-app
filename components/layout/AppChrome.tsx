"use client";

import { usePathname } from "next/navigation";
import AddEntryBar from "./AddEntryBar";
import BottomNav from "./BottomNav";

/** ノート画面では、日記用の新規追加バー（予定・タスク等）を隠す。ノート自体の追加ボタンはページ内にある */
export default function AppChrome() {
  const pathname = usePathname();
  const hideAddEntryBar = pathname.startsWith("/notes");

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 flex flex-col shadow-[0_-2px_12px_rgba(0,0,0,0.08)]">
      {!hideAddEntryBar && <AddEntryBar />}
      <BottomNav />
    </div>
  );
}
