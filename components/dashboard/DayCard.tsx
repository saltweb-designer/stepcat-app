import { NotebookText } from "lucide-react";
import type { DayEntry } from "@/lib/types";
import ScheduleBadge from "./ScheduleBadge";
import TaskChecklist from "./TaskChecklist";
import MemoList from "./MemoList";
import LinkChips from "./LinkChips";
import WellnessSection from "@/components/wellness/WellnessSection";

function formatDate(dateStr: string) {
  const d = new Date(`${dateStr}T00:00:00`);
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

export default function DayCard({ entry }: { entry: DayEntry }) {
  const doneCount = entry.tasks.filter((t) => t.completedDates.includes(entry.date)).length;

  return (
    <article
      id={`day-${entry.date}`}
      className={`scroll-mt-20 rounded-2xl bg-white p-4 shadow-sm sm:p-5 ${
        entry.isToday ? "ring-2 ring-black/10" : ""
      }`}
    >
      <header className="mb-3 flex items-center gap-3">
        <div
          className={`flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-xl text-center ${
            entry.isToday
              ? "bg-black text-white"
              : entry.holidayName
                ? "bg-rose-50 text-rose-600"
                : "bg-gray-100 text-gray-700"
          }`}
        >
          <span className="text-[10px] font-medium leading-none opacity-80">{entry.dayLabel}</span>
          <span className="text-base font-bold leading-tight">{formatDate(entry.date)}</span>
        </div>
        <div className="min-w-0 flex-1">
          <p className="flex flex-wrap items-center gap-1.5 text-sm font-semibold text-gray-900">
            <span className={entry.holidayName ? "text-rose-600" : undefined}>{entry.dayLabel}曜日</span>
            {entry.isToday && (
              <span className="rounded-full bg-black px-2 py-0.5 text-[10px] font-semibold text-white">
                今日
              </span>
            )}
            {entry.holidayName && (
              <span className="rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-semibold text-rose-600">
                祝 {entry.holidayName}
              </span>
            )}
          </p>
          <p className="text-xs text-gray-500">
            タスク {doneCount}/{entry.tasks.length} 完了
          </p>
        </div>
      </header>

      {entry.schedules.length > 0 && (
        <div className="mb-3 flex flex-col gap-1.5">
          {entry.schedules.map((schedule) => (
            <ScheduleBadge key={schedule.id} entry={schedule} />
          ))}
        </div>
      )}

      <div className="mb-3">
        <TaskChecklist tasks={entry.tasks} date={entry.date} />
      </div>

      <WellnessSection date={entry.date} />

      <div className="mb-3 flex items-start gap-2 rounded-xl bg-gray-50 px-3 py-2.5">
        <NotebookText className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" strokeWidth={2} />
        <MemoList memos={entry.memos} />
      </div>

      <LinkChips links={entry.links} />
    </article>
  );
}
