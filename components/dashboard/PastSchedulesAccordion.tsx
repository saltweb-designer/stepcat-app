import { ChevronRight } from "lucide-react";
import type { DayEntry } from "@/lib/types";
import DayCard from "./DayCard";

export default function PastSchedulesAccordion({ entries }: { entries: DayEntry[] }) {
  if (entries.length === 0) return null;

  return (
    <details className="group rounded-2xl bg-white shadow-sm">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-2 px-4 py-3.5 sm:px-5 [&::-webkit-details-marker]:hidden">
        <span className="flex items-center gap-2 text-sm font-semibold text-gray-500">
          <ChevronRight className="h-4 w-4 shrink-0 transition-transform group-open:rotate-90" strokeWidth={2} />
          過去のスケジュール（{entries.length}日分）
        </span>
        <span className="text-xs text-gray-400">タップして表示</span>
      </summary>
      <div className="flex flex-col gap-4 border-t border-gray-100 p-4 pt-4 sm:p-5 sm:pt-4">
        {entries.map((entry) => (
          <DayCard key={entry.date} entry={entry} />
        ))}
      </div>
    </details>
  );
}
