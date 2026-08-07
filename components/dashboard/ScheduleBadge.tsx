import { CalendarRange, Clock } from "lucide-react";
import type { EntryDoc } from "@/lib/types";
import { formatPeriodLabel } from "@/lib/build-week-entries";
import EntryActions from "@/components/entry-form/EntryActions";

function formatTiming(entry: EntryDoc) {
  if (entry.allDay) return "終日";
  return entry.endTime ? `${entry.startTime}〜${entry.endTime}` : entry.startTime;
}

export default function ScheduleBadge({ entry }: { entry: EntryDoc }) {
  const periodLabel = formatPeriodLabel(entry.startDate, entry.endDate);

  return (
    <div className="flex items-start gap-2 rounded-xl bg-gray-100 px-3 py-2 text-gray-900">
      <span className="mt-0.5 shrink-0 text-gray-500">
        {entry.allDay ? <CalendarRange className="h-4 w-4" strokeWidth={2} /> : <Clock className="h-4 w-4" strokeWidth={2} />}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{entry.title}</p>
        <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-xs text-gray-600">
          {periodLabel && (
            <span className="rounded-full bg-gray-200 px-2 py-0.5 font-medium">{periodLabel}</span>
          )}
          <span className="rounded-full bg-white px-2 py-0.5 font-medium ring-1 ring-inset ring-gray-300">
            {formatTiming(entry)}
          </span>
        </div>
      </div>
      <EntryActions entry={entry} />
    </div>
  );
}
