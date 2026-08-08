"use client";

import { useMemo } from "react";
import Image from "next/image";
import DayCard from "./DayCard";
import PastSchedulesAccordion from "./PastSchedulesAccordion";
import WeekSummaryCard from "./WeekSummaryCard";
import AddEntryButton from "@/components/entry-form/AddEntryButton";
import { useAuth } from "@/contexts/AuthContext";
import { useEntries } from "@/hooks/useEntries";
import { getCurrentWeekDates, formatWeekPeriodLabel } from "@/lib/week";
import { buildWeekEntries } from "@/lib/build-week-entries";

export default function WeekTimeline() {
  const { user } = useAuth();
  const { entries, loading } = useEntries(user?.uid);

  const weekDates = useMemo(() => getCurrentWeekDates(), []);
  const periodLabel = useMemo(() => formatWeekPeriodLabel(weekDates), [weekDates]);
  const weekEntries = useMemo(() => buildWeekEntries(weekDates, entries), [weekDates, entries]);

  const todayIndex = weekEntries.findIndex((entry) => entry.isToday);
  const pastEntries = todayIndex >= 0 ? weekEntries.slice(0, todayIndex) : [];
  const todayEntry = todayIndex >= 0 ? weekEntries[todayIndex] : null;
  const futureEntries = todayIndex >= 0 ? weekEntries.slice(todayIndex + 1) : weekEntries;

  return (
    <section aria-labelledby="week-timeline-heading">
      <div className="relative mb-4 overflow-hidden rounded-2xl bg-gray-800 p-4 text-white shadow-sm sm:p-5">
        <div className="relative z-10 pr-16 sm:pr-20">
          <div className="flex items-end justify-between gap-2">
            <h2 id="week-timeline-heading" className="text-sm font-bold text-white">
              今週のタイムライン
            </h2>
            <span className="text-xs font-semibold text-white/60">{periodLabel}</span>
          </div>

          {weekDates.length > 0 && <WeekSummaryCard weekStartDate={weekDates[0].date} />}
        </div>

        <div className="pointer-events-none absolute -bottom-2 -right-2 h-16 w-20 sm:h-20 sm:w-24">
          <Image src="/home_ai.png" alt="" fill sizes="96px" className="object-contain object-bottom" />
        </div>
      </div>

      <div className="mb-3">
        <AddEntryButton variant="compact" />
      </div>

      {loading ? (
        <div className="flex justify-center py-10">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-gray-300 border-t-gray-900" />
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <PastSchedulesAccordion entries={pastEntries} />
          {todayEntry && <DayCard entry={todayEntry} />}
          {futureEntries.map((entry) => (
            <DayCard key={entry.date} entry={entry} />
          ))}
        </div>
      )}
    </section>
  );
}
