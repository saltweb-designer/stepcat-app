"use client";

import { useMemo } from "react";
import { ChevronDown } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useWeekSummary } from "@/hooks/useWeekSummary";
import type { MonthCell } from "@/lib/month";
import type { EntryDoc } from "@/lib/types";
import { getDayLabel, toIsoDate } from "@/lib/week";
import { buildDayEntry, getDatesWithEntries } from "@/lib/build-week-entries";
import DayCard from "./DayCard";
import WeekSummaryCard from "./WeekSummaryCard";
import ActionBalanceCard from "@/components/action-log/ActionBalanceCard";
import { WEEK_BAND_STYLES, WEEK_MARK_COLORS, getWeekBand, type WeekMarkColor } from "@/lib/week-colors";

function formatRangeLabel(cells: MonthCell[]) {
  const format = (iso: string) => {
    const [, m, d] = iso.split("-");
    return `${Number(m)}/${Number(d)}`;
  };
  return `${format(cells[0].date)}〜${format(cells[cells.length - 1].date)}`;
}

const SUMMARY_PREVIEW_LIMIT = 20;

function truncateSummaryPreview(text: string) {
  return text.length > SUMMARY_PREVIEW_LIMIT ? `${text.slice(0, SUMMARY_PREVIEW_LIMIT)}...` : text;
}

export default function WeeklyReviewAccordion({
  weekNumber,
  cells,
  entries,
  open,
  onToggle,
  markColor,
  onChangeMarkColor,
  goalDates,
  onToggleGoalDate,
}: {
  weekNumber: number;
  cells: MonthCell[];
  entries: EntryDoc[];
  open: boolean;
  onToggle: () => void;
  markColor: WeekMarkColor | undefined;
  onChangeMarkColor: (color: WeekMarkColor | null) => void;
  goalDates: Set<string>;
  onToggleGoalDate: (date: string) => void;
}) {
  const { user } = useAuth();
  const { text: summaryText } = useWeekSummary(user?.uid, cells[0].date);
  const todayIso = useMemo(() => toIsoDate(new Date()), []);
  const datesWithEntries = useMemo(() => getDatesWithEntries(entries), [entries]);
  const cellsInMonth = cells.filter((cell) => cell.inCurrentMonth);
  const recordedCount = cellsInMonth.filter((cell) => datesWithEntries.has(cell.date)).length;
  const isCurrentWeek = cells.some((cell) => cell.isToday);
  const band = getWeekBand(isCurrentWeek, markColor);

  return (
    // 今日を含む週は赤、自分で色をつけた大事な週はその色の枠と背景で、ひと目でわかるようにする
    <div className={`overflow-hidden rounded-2xl shadow-sm ${band ? band.box : "bg-white"}`}>
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="flex w-full flex-col gap-1 px-4 py-3.5 text-left sm:px-5"
      >
        <span className="flex items-center justify-between gap-2">
          <span className="flex items-center gap-2 text-sm font-semibold text-gray-900">
            <ChevronDown
              className={`h-4 w-4 shrink-0 text-gray-400 transition-transform ${open ? "rotate-180" : ""}`}
              strokeWidth={2}
            />
            第{weekNumber}週
            <span className="text-xs font-normal text-red-500">{formatRangeLabel(cells)}</span>
          </span>
          <span className="shrink-0 text-xs text-gray-400">記録 {recordedCount}/{cellsInMonth.length}日</span>
        </span>
        {summaryText && (
          <span className="truncate pl-6 text-xs text-gray-500">{truncateSummaryPreview(summaryText)}</span>
        )}
      </button>

      {open && (
        <div className="flex flex-col gap-4 border-t border-gray-100 bg-white p-4 pt-4 sm:p-5 sm:pt-4">
          <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500">
            <span className="font-semibold">週の色</span>
            {WEEK_MARK_COLORS.map((color) => {
              const selected = markColor === color;
              return (
                <button
                  key={color}
                  type="button"
                  onClick={() => onChangeMarkColor(selected ? null : color)}
                  aria-pressed={selected}
                  className={`flex items-center gap-1.5 rounded-full border px-3 py-1 font-semibold transition-colors ${
                    selected ? "border-gray-900 text-gray-900" : "border-gray-200 hover:bg-gray-50"
                  }`}
                >
                  <span className={`h-3 w-3 rounded-full ${WEEK_BAND_STYLES[color].swatch}`} />
                  {WEEK_BAND_STYLES[color].label}
                </button>
              );
            })}
            {markColor && (
              <button
                type="button"
                onClick={() => onChangeMarkColor(null)}
                className="rounded-full border border-gray-200 px-3 py-1 font-semibold transition-colors hover:bg-gray-50"
              >
                外す
              </button>
            )}
            {isCurrentWeek && markColor && <span className="text-gray-400">今週の間は赤で表示されます</span>}
          </div>
          {/* 色をつけた週だけ、目的の日を選んでカレンダーで濃い色に塗れるようにする */}
          {markColor && (
            <div className="flex flex-col gap-1.5 text-xs text-gray-500">
              <span className="font-semibold">目的の日（押すと付け外しできます）</span>
              <div className="grid grid-cols-7 gap-1">
                {cells.map((cell) => {
                  const selected = goalDates.has(cell.date);
                  return (
                    <button
                      key={cell.date}
                      type="button"
                      onClick={() => onToggleGoalDate(cell.date)}
                      aria-pressed={selected}
                      className={`flex flex-col items-center rounded-lg border py-1 transition-colors ${
                        selected
                          ? `border-transparent ${WEEK_BAND_STYLES[markColor].goal}`
                          : "border-gray-200 text-gray-700 hover:bg-gray-50"
                      }`}
                    >
                      <span className="text-[10px]">{getDayLabel(cell.date)}</span>
                      <span className="text-sm">{cell.day}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
          {/* アコーディオンの中では箱を重ねず、入力欄を横いっぱいに使えるようにする */}
          {/* 背景のグレーを左右の端まで広げて、入力できる場所だとひと目でわかるようにする */}
          <div className="-mx-4 bg-gray-100 px-4 py-3 sm:-mx-5 sm:px-5">
            <WeekSummaryCard weekStartDate={cells[0].date} plain rangeLabel={formatRangeLabel(cells)} />
          </div>
          <ActionBalanceCard
            periods={[
              { label: "この週", startDate: cells[0].date, endDate: cells[cells.length - 1].date },
            ]}
          />
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
