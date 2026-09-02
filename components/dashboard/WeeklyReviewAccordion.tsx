"use client";

import { useMemo } from "react";
import Image from "next/image";
import { ChevronDown } from "lucide-react";
import type { MonthCell } from "@/lib/month";
import type { EntryDoc } from "@/lib/types";
import { getDayLabel, toIsoDate } from "@/lib/week";
import { buildDayEntry, getDatesWithEntries } from "@/lib/build-week-entries";
import DayCard from "./DayCard";
import WeekSummaryCard from "./WeekSummaryCard";

function formatRangeLabel(cells: MonthCell[]) {
  const format = (iso: string) => {
    const [, m, d] = iso.split("-");
    return `${Number(m)}/${Number(d)}`;
  };
  return `${format(cells[0].date)}〜${format(cells[cells.length - 1].date)}`;
}

export default function WeeklyReviewAccordion({
  weekNumber,
  cells,
  entries,
  open,
  onToggle,
}: {
  weekNumber: number;
  cells: MonthCell[];
  entries: EntryDoc[];
  open: boolean;
  onToggle: () => void;
}) {
  const todayIso = useMemo(() => toIsoDate(new Date()), []);
  const datesWithEntries = useMemo(() => getDatesWithEntries(entries), [entries]);
  const cellsInMonth = cells.filter((cell) => cell.inCurrentMonth);
  const recordedCount = cellsInMonth.filter((cell) => datesWithEntries.has(cell.date)).length;

  return (
    <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-2 px-4 py-3.5 text-left sm:px-5"
      >
        <span className="flex items-center gap-2 text-sm font-semibold text-gray-900">
          <ChevronDown
            className={`h-4 w-4 shrink-0 text-gray-400 transition-transform ${open ? "rotate-180" : ""}`}
            strokeWidth={2}
          />
          第{weekNumber}週
          <span className="text-xs font-normal text-gray-400">{formatRangeLabel(cells)}</span>
        </span>
        <span className="text-xs text-gray-400">記録 {recordedCount}/{cellsInMonth.length}日</span>
      </button>

      {open && (
        <div className="flex flex-col gap-4 border-t border-gray-100 p-4 pt-4 sm:p-5 sm:pt-4">
          <div className="relative overflow-hidden rounded-2xl bg-gray-800 p-4 text-white shadow-sm sm:p-5">
            <div className="relative z-10 pr-16 sm:pr-20">
              <WeekSummaryCard weekStartDate={cells[0].date} />
            </div>
            <div className="pointer-events-none absolute -bottom-2 -right-2 h-16 w-20 sm:h-20 sm:w-24">
              <Image src="/home_ai.png" alt="" fill sizes="96px" className="object-contain object-bottom" />
            </div>
          </div>
          {cellsInMonth.map((cell) => {
            const entry = buildDayEntry(cell.date, getDayLabel(cell.date), cell.date === todayIso, entries);
            return <DayCard key={cell.date} entry={entry} />;
          })}
          <button
            type="button"
            onClick={onToggle}
            className="self-center rounded-full border border-gray-200 px-4 py-1.5 text-xs font-semibold text-gray-500 transition-colors hover:bg-gray-50"
          >
            閉じる
          </button>
        </div>
      )}
    </div>
  );
}
