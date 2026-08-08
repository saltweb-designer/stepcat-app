"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Header from "@/components/layout/Header";
import LoginPrompt from "@/components/auth/LoginPrompt";
import DayCard from "@/components/dashboard/DayCard";
import AddEntryButton from "@/components/entry-form/AddEntryButton";
import { useAuth } from "@/contexts/AuthContext";
import { useEntries } from "@/hooks/useEntries";
import { getMonthGrid, type MonthCell } from "@/lib/month";
import { getDayLabel, toIsoDate } from "@/lib/week";
import { buildDayEntry, getDatesWithEntries } from "@/lib/build-week-entries";
import { getHolidayName } from "@/lib/holidays";

const WEEKDAY_HEADERS = ["月", "火", "水", "木", "金", "土", "日"];

function cellClassName(cell: MonthCell, isSelected: boolean, holidayName: string | undefined) {
  if (isSelected) return "bg-black text-white";
  if (!cell.inCurrentMonth) return "text-gray-300 hover:bg-gray-50";
  if (holidayName) return "text-rose-600 hover:bg-gray-50";
  if (cell.isToday) return "bg-gray-100 font-bold text-gray-900 hover:bg-gray-200";
  return "text-gray-700 hover:bg-gray-50";
}

export default function CalendarPage() {
  const { user, loading } = useAuth();
  const { entries } = useEntries(user?.uid);

  const today = useMemo(() => new Date(), []);
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth() + 1);
  const [selectedDate, setSelectedDate] = useState(() => toIsoDate(today));

  const weeks = useMemo(() => getMonthGrid(viewYear, viewMonth, today), [viewYear, viewMonth, today]);
  const datesWithEntries = useMemo(() => getDatesWithEntries(entries), [entries]);
  const selectedEntry = useMemo(
    () => buildDayEntry(selectedDate, getDayLabel(selectedDate), selectedDate === toIsoDate(today), entries),
    [selectedDate, entries, today]
  );

  const goToPrevMonth = () => {
    if (viewMonth === 1) {
      setViewYear((y) => y - 1);
      setViewMonth(12);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const goToNextMonth = () => {
    if (viewMonth === 12) {
      setViewYear((y) => y + 1);
      setViewMonth(1);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  const [, selM, selD] = selectedDate.split("-");
  const selectedLabel = `${Number(selM)}月${Number(selD)}日（${getDayLabel(selectedDate)}）`;

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
                      const isSelected = cell.date === selectedDate;
                      return (
                        <button
                          key={cell.date}
                          type="button"
                          onClick={() => setSelectedDate(cell.date)}
                          className={`flex flex-col items-center gap-0.5 rounded-lg py-2 text-sm transition-colors ${cellClassName(cell, isSelected, holidayName)}`}
                        >
                          <span>{cell.day}</span>
                          <span
                            className={`h-1 w-1 rounded-full ${
                              hasEntries ? (isSelected ? "bg-white" : "bg-gray-900") : "bg-transparent"
                            }`}
                          />
                        </button>
                      );
                    })}
                  </div>
                ))}
              </div>
            </section>

            <section>
              <h2 className="mb-2 text-sm font-semibold text-gray-700">{selectedLabel}の記録</h2>
              <DayCard entry={selectedEntry} />
              <div className="mt-3">
                <AddEntryButton initialDate={selectedDate} />
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
