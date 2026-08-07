import { CalendarRange, Clock } from "lucide-react";
import type { Schedule } from "@/lib/types";

function formatTiming(schedule: Schedule) {
  if (schedule.timing.kind === "all-day") return "終日";
  const { start, end } = schedule.timing;
  return end ? `${start}〜${end}` : start;
}

export default function ScheduleBadge({ schedule }: { schedule: Schedule }) {
  const isAllDay = schedule.timing.kind === "all-day";

  return (
    <div className="flex items-start gap-2 rounded-xl bg-gray-100 px-3 py-2 text-gray-900">
      <span className="mt-0.5 shrink-0 text-gray-500">
        {isAllDay ? <CalendarRange className="h-4 w-4" strokeWidth={2} /> : <Clock className="h-4 w-4" strokeWidth={2} />}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{schedule.title}</p>
        <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-xs text-gray-600">
          {schedule.periodLabel && (
            <span className="rounded-full bg-gray-200 px-2 py-0.5 font-medium">{schedule.periodLabel}</span>
          )}
          <span className="rounded-full bg-white px-2 py-0.5 font-medium ring-1 ring-inset ring-gray-300">
            {formatTiming(schedule)}
          </span>
        </div>
      </div>
    </div>
  );
}
