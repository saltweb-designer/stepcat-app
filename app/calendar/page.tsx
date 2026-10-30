"use client";

import { useMemo, useState } from "react";
import { flushSync } from "react-dom";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Header from "@/components/layout/Header";
import LoginPrompt from "@/components/auth/LoginPrompt";
import ErrorBanner from "@/components/dashboard/ErrorBanner";
import MonthGoalCard from "@/components/dashboard/MonthGoalCard";
import WeeklyReviewAccordion from "@/components/dashboard/WeeklyReviewAccordion";
import ActionBalanceCard from "@/components/action-log/ActionBalanceCard";
import { useAuth } from "@/contexts/AuthContext";
import { useEntries } from "@/hooks/useEntries";
import { useWeekColors } from "@/hooks/useWeekColors";
import { getMonthGrid, toMonthKey, type MonthCell } from "@/lib/month";
import { getDatesWithEntries } from "@/lib/build-week-entries";
import { getHolidayName } from "@/lib/holidays";
import { toIsoDate } from "@/lib/week";
import { WEEK_BAND_STYLES, getWeekBand } from "@/lib/week-colors";

const WEEKDAY_HEADERS = ["月", "火", "水", "木", "金", "土", "日"];

function cellClassName(
  cell: MonthCell,
  isInOpenWeek: boolean,
  holidayName: string | undefined,
  goalClassName: string | undefined
) {
  // 今日が目的の日でもあるときは、目的の日の色に赤い輪をつけて両方わかるようにする
  if (goalClassName) return cell.isToday ? `${goalClassName} ring-2 ring-red-500 ring-offset-1` : goalClassName;
  if (cell.isToday) return "bg-red-500 font-bold text-white hover:bg-red-600";
  if (!cell.inCurrentMonth) return "text-gray-300 hover:bg-gray-50";
  if (isInOpenWeek) return "bg-gray-50 text-gray-900 hover:bg-gray-100";
  if (holidayName) return "text-rose-600 hover:bg-gray-50";
  return "text-gray-700 hover:bg-gray-50";
}

/** compact はページ上部用。縦幅をとらないよう小さく表示する */
function MonthNav({
  className,
  label,
  onPrev,
  onNext,
  onLabelClick,
  compact = false,
}: {
  className?: string;
  label: string;
  onPrev: () => void;
  onNext: () => void;
  onLabelClick?: () => void;
  compact?: boolean;
}) {
  const arrowClassName = `flex items-center justify-center rounded-full text-gray-500 transition-colors hover:bg-gray-200 ${
    compact ? "h-6 w-6" : "h-8 w-8"
  }`;
  const iconClassName = compact ? "h-3.5 w-3.5" : "h-4 w-4";
  const labelClassName = `font-bold text-gray-900 ${compact ? "text-xs" : "text-sm"}`;
  return (
    <div className={`flex items-center justify-between ${className ?? ""}`}>
      <button type="button" onClick={onPrev} aria-label="前の月" className={arrowClassName}>
        <ChevronLeft className={iconClassName} strokeWidth={2} />
      </button>
      {onLabelClick ? (
        <button
          type="button"
          onClick={onLabelClick}
          title="今週へ移動"
          className={`${labelClassName} rounded-full px-3 py-0.5 transition-colors hover:bg-gray-200`}
        >
          {label}
        </button>
      ) : (
        <p className={labelClassName}>{label}</p>
      )}
      <button type="button" onClick={onNext} aria-label="次の月" className={arrowClassName}>
        <ChevronRight className={iconClassName} strokeWidth={2} />
      </button>
    </div>
  );
}

export default function CalendarPage() {
  const { user, loading } = useAuth();
  const { entries, error } = useEntries(user?.uid);
  const { colors: weekColors, goalDates, saveWeekColor, toggleGoalDate } = useWeekColors(user?.uid);

  const today = useMemo(() => new Date(), []);
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth() + 1);
  const [openWeekIndex, setOpenWeekIndex] = useState<number | null>(null);

  const viewMonthKey = useMemo(() => toMonthKey(viewYear, viewMonth), [viewYear, viewMonth]);
  const monthPeriod = useMemo(
    () => ({
      label: `${viewMonth}月`,
      startDate: toIsoDate(new Date(viewYear, viewMonth - 1, 1)),
      endDate: toIsoDate(new Date(viewYear, viewMonth, 0)),
    }),
    [viewYear, viewMonth]
  );
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

  /** 今月に戻して、今日を含む週のアコーディオンを開いてそこまでスクロールする */
  const goToCurrentWeek = () => {
    const year = today.getFullYear();
    const month = today.getMonth() + 1;
    const weekIndex = getMonthGrid(year, month, today)
      .filter((week) => week.some((cell) => cell.inCurrentMonth))
      .findIndex((week) => week.some((cell) => cell.isToday));
    if (weekIndex < 0) return;
    // 別の月を表示中でも、今月の週を描画し終えてからスクロールする
    flushSync(() => {
      setViewYear(year);
      setViewMonth(month);
      setOpenWeekIndex(weekIndex);
    });
    document.getElementById(`review-week-${weekIndex}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
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
      <main className="mx-auto flex max-w-2xl flex-col gap-6 px-4 py-6 pb-10 sm:px-6">
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-gray-900" />
          </div>
        ) : user ? (
          <>
            {error && <ErrorBanner message={error} />}

            <MonthNav
              compact
              className="-my-3"
              label={`${viewYear}年${viewMonth}月`}
              onPrev={goToPrevMonth}
              onNext={goToNextMonth}
              onLabelClick={goToCurrentWeek}
            />

            <MonthGoalCard monthKey={viewMonthKey} monthLabel={`${viewYear}年${viewMonth}月`} />

            <ActionBalanceCard periods={[monthPeriod]} compactTitle />

            <section>
              <h2 className="mb-1.5 text-xs font-semibold text-gray-500">週間ごとの振り返り</h2>
              <div className="flex flex-col gap-3">
                {weeksInMonth.map((weekCells, index) => (
                  <div key={weekCells[0].date} id={`review-week-${index}`}>
                    <WeeklyReviewAccordion
                      weekNumber={index + 1}
                      cells={weekCells}
                      entries={entries}
                      open={openWeekIndex === index}
                      onToggle={() => setOpenWeekIndex((current) => (current === index ? null : index))}
                      markColor={weekColors[weekCells[0].date]}
                      onChangeMarkColor={(color) => {
                        saveWeekColor(
                          weekCells.map((cell) => cell.date),
                          color
                        ).catch((err) => console.error("週の色の保存に失敗しました", err));
                      }}
                      goalDates={goalDates}
                      onToggleGoalDate={(date) => {
                        toggleGoalDate(date).catch((err) => console.error("目的の日の保存に失敗しました", err));
                      }}
                    />
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-2xl bg-white p-4 shadow-sm sm:p-5">
              <MonthNav
                className="mb-3"
                label={`${viewYear}年${viewMonth}月`}
                onPrev={goToPrevMonth}
                onNext={goToNextMonth}
              />

              <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-semibold text-gray-400">
                {WEEKDAY_HEADERS.map((label) => (
                  <div key={label}>{label}</div>
                ))}
              </div>

              <div className="mt-1 flex flex-col gap-1">
                {weeks.map((week) => {
                  // 今日を含む週・色をつけた週は、週の振り返りの枠と同じ色で区間を塗る
                  const markColor = weekColors[week[0].date];
                  const band = getWeekBand(week.some((cell) => cell.isToday), markColor);
                  return (
                    <div key={week[0].date} className={`grid grid-cols-7 gap-1 rounded-lg ${band ? band.row : ""}`}>
                      {week.map((cell) => {
                        const holidayName = getHolidayName(cell.date);
                        // 目的の日は、その週に選んだ色（青・緑）の濃い色で塗る
                        const goalClassName =
                          markColor && goalDates.has(cell.date) ? WEEK_BAND_STYLES[markColor].goal : undefined;
                        const hasEntries = datesWithEntries.has(cell.date);
                        // 色の帯がある週は、開いているときの灰色で帯が隠れないようにする
                        const isInOpenWeek =
                          !band && openWeekIndex !== null && weekIndexByDate.get(cell.date) === openWeekIndex;
                        return (
                          <button
                            key={cell.date}
                            type="button"
                            onClick={() => handleSelectDate(cell.date)}
                            className={`flex flex-col items-center gap-0.5 rounded-lg py-2 text-sm transition-colors ${cellClassName(cell, isInOpenWeek, holidayName, goalClassName)}`}
                          >
                            <span>{cell.day}</span>
                            <span
                              className={`h-1 w-1 rounded-full ${hasEntries ? (cell.isToday || goalClassName ? "bg-white" : "bg-gray-900") : "bg-transparent"}`}
                            />
                          </button>
                        );
                      })}
                    </div>
                  );
                })}
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
