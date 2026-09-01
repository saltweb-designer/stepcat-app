"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Header from "@/components/layout/Header";
import LoginPrompt from "@/components/auth/LoginPrompt";
import ErrorBanner from "@/components/dashboard/ErrorBanner";
import WeeklyReviewAccordion from "@/components/dashboard/WeeklyReviewAccordion";
import { useAuth } from "@/contexts/AuthContext";
import { useEntries } from "@/hooks/useEntries";
import { getMonthGrid, type MonthCell } from "@/lib/month";
import { getDatesWithEntries } from "@/lib/build-week-entries";
import { getHolidayName } from "@/lib/holidays";

const WEEKDAY_HEADERS = ["月", "火", "水", "木", "金", "土", "日"];

function cellClassName(cell: MonthCell, isInOpenWeek: boolean, holidayName: string | undefined) {
  if (!cell.inCurrentMonth) return "text-gray-300 hover:bg-gray-50";
  if (cell.isToday) return "bg-gray-100 font-bold text-gray-900 hover:bg-gray-200";
  if (isInOpenWeek) return "bg-gray-50 text-gray-900 hover:bg-gray-100";
  if (holidayName) return "text-rose-600 hover:bg-gray-50";
  return "text-gray-700 hover:bg-gray-50";
}

export default function CalendarPage() {
  const { user, loading } = useAuth();
  const { entries, error } = useEntries(user?.uid);

  const today = useMemo(() => new Date(), []);
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth() + 1);
  const [openWeekIndex, setOpenWeekIndex] = useState<number | null>(null);

  const weeks = useMemo(() => getMonthGrid(viewYear, viewMonth, today), [viewYear, viewMonth, today]);
  const weeksInMonth = useMemo(() => weeks.filter((week) => week.some((cell) => cell.inCurrentMonth)), [weeks]);
  const datesWithEntries = useMemo(() => getDatesWithEntries(entries), [entries]);

  const weekIndexByDate = useMemo(() => {
    const map = new Map<string, number>();
    weeksInMonth.forEach((week, index) => {
      for (const cell of week) map.set(cell.date, index);
    });
    return map;
  }, [weeksInMonth]);

  const goToPrevMonth = () => {
    setOpenWeekIndex(null);
    if (viewMonth === 1) {
      setViewYear((y) => y - 1);
      setViewMonth(12);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const goToNextMonth = () => {
    setOpenWeekIndex(null);
    if (viewMonth === 12) {
      setViewYear((y) => y + 1);
      setViewMonth(1);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  const handleSelectDate = (date: string) => {
    const weekIndex = weekIndexByDate.get(date);
    if (weekIndex === undefined) return;
    setOpenWeekIndex((current) => (current === weekIndex ? null : weekIndex));
    requestAnimationFrame(() => {
      document.getElementById(`review-week-${weekIndex}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <Header />
      <main className="mx-auto flex max-w-2xl flex-col gap-6 px-4 py-6 pb-32 sm:px-6">
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-gray-900" />
          </div>
        ) : user ? (
          <>
            {error && <ErrorBanner message={error} />}
            <section className="rounded-2xl bg-white p-4 shadow-sm sm:p-5">
              <div className="mb-3 flex items-center justify-between">
                <button
                  type="button"
                  onClick={goToPrevMonth}
                  aria-label="前の月"
                  className="flex h-8 w-8 items-center justify-center rounded-full text-gray-500 transition-colors hover:bg-gray-100"
                >
                  <ChevronLeft className="h-4 w-4" strokeWidth={2} />
                </button>
                <p className="text-sm font-bold text-gray-900">
                  {viewYear}年{viewMonth}月
                </p>
                <button
                  type="button"
                  onClick={goToNextMonth}
                  aria-label="次の月"
                  className="flex h-8 w-8 items-center justify-center rounded-full text-gray-500 transition-colors hover:bg-gray-100"
                >
                  <ChevronRight className="h-4 w-4" strokeWidth={2} />
                </button>
              </div>

              <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-semibold text-gray-400">
                {WEEKDAY_HEADERS.map((label) => (
                  <div key={label}>{label}</div>
                ))}
              </div>

              <div className="mt-1 flex flex-col gap-1">
                {weeks.map((week) => (
                  <div key={week[0].date} className="grid grid-cols-7 gap-1">
                    {week.map((cell) => {
                      const holidayName = getHolidayName(cell.date);
                      const hasEntries = datesWithEntries.has(cell.date);
                      const isInOpenWeek = openWeekIndex !== null && weekIndexByDate.get(cell.date) === openWeekIndex;
                      return (
                        <button
                          key={cell.date}
                          type="button"
                          onClick={() => handleSelectDate(cell.date)}
                          className={`flex flex-col items-center gap-0.5 rounded-lg py-2 text-sm transition-colors ${cellClassName(cell, isInOpenWeek, holidayName)}`}
                        >
                          <span>{cell.day}</span>
                          <span
                            className={`h-1 w-1 rounded-full ${hasEntries ? "bg-gray-900" : "bg-transparent"}`}
                          />
                        </button>
                      );
                    })}
                  </div>
                ))}
              </div>
            </section>

            <section>
              <h2 className="mb-2 text-sm font-semibold text-gray-700">週間ごとの振り返り</h2>
              <div className="flex flex-col gap-3">
                {weeksInMonth.map((weekCells, index) => (
                  <div key={weekCells[0].date} id={`review-week-${index}`}>
                    <WeeklyReviewAccordion
                      weekNumber={index + 1}
                      cells={weekCells}
                      entries={entries}
                      open={openWeekIndex === index}
                      onToggle={() => setOpenWeekIndex((current) => (current === index ? null : index))}
                    />
                  </div>
                ))}
              </div>
            </section>
          </>
        ) : (
          <LoginPrompt />
        )}
      </main>
    </div>
  );
}
