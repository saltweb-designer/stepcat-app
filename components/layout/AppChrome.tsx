"use client";

import { usePathname } from "next/navigation";
import AiChatBar from "./AiChatBar";
import BottomNav from "./BottomNav";

/** チャット画面自体では、AI相談バーとタブナビゲーションを隠す */
export default function AppChrome() {
  const pathname = usePathname();
  if (pathname.startsWith("/chat")) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 flex flex-col shadow-[0_-2px_12px_rgba(0,0,0,0.08)]">
      <AiChatBar />
      <BottomNav />
    </div>
  );
}
