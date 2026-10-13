"use client";

import { useMemo, useState } from "react";
import { ChevronDown } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useActionCounts } from "@/hooks/useActionCounts";
import { useMonthGoal } from "@/hooks/useMonthGoal";
import { ACTION_ORIGINS } from "@/lib/action-log";
import { toMonthKey } from "@/lib/month";
import { getCurrentWeekDates, toIsoDate } from "@/lib/week";
import ActionBalanceCard, { type BalancePeriod } from "@/components/action-log/ActionBalanceCard";
import InlineAccordion from "@/components/notes/InlineAccordion";
import MonthGoalCard from "./MonthGoalCard";

/** ホーム用。「今月の目標」と「行動の起点バランス」をまとめて開閉する。閉じていても今月の起点の件数は見える */
export default function MonthOverviewAccordion() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);

  const { monthKey, periods } = useMemo(() => {
    const today = new Date();
    const weekDates = getCurrentWeekDates(today);
    const periods: BalancePeriod[] = [
      {
        label: "今月",
        startDate: toIsoDate(new Date(today.getFullYear(), today.getMonth(), 1)),
        endDate: toIsoDate(new Date(today.getFullYear(), today.getMonth() + 1, 0)),
      },
      { label: "今週", startDate: weekDates[0].date, endDate: weekDates[weekDates.length - 1].date },
    ];
    return { monthKey: toMonthKey(today.getFullYear(), today.getMonth() + 1), periods };
  }, []);

  const monthPeriod = periods[0];
  const { counts, loading, error } = useActionCounts(user?.uid, monthPeriod.startDate, monthPeriod.endDate);
  const { text: goalText } = useMonthGoal(user?.uid, monthKey);

  return (
    <section className="overflow-hidden rounded-2xl bg-white shadow-sm">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full flex-col gap-1 px-4 py-3.5 text-left sm:px-5"
      >
        <span className="flex items-center justify-between gap-2">
          <span className="flex min-w-0 items-center gap-2 text-sm font-bold text-gray-900">
            <ChevronDown
              className={`h-4 w-4 shrink-0 text-gray-400 transition-transform ${open ? "rotate-180" : ""}`}
              strokeWidth={2}
            />
            <span className="truncate">今月の目標と行動</span>
          </span>
          {!loading && !error && (
            <span className="flex shrink-0 items-center gap-2 text-[11px] font-semibold text-gray-500">
              <span className="text-gray-400">今月</span>
              {ACTION_ORIGINS.map((origin) => (
                <span key={origin.key} className="flex items-center gap-1" title={origin.label}>
                  <span className={`h-2 w-2 rounded-full ${origin.dotClass}`} />
                  {counts[origin.key]}
                </span>
              ))}
            </span>
          )}
        </span>
        {goalText && <span className="truncate pl-6 text-xs text-gray-500">目標：{goalText}</span>}
      </button>

      <InlineAccordion open={open}>
        <div className="flex flex-col gap-4 border-t border-gray-100 p-4 sm:p-5">
          <MonthGoalCard monthKey={monthKey} monthLabel="今月" />
          <ActionBalanceCard periods={periods} embedded />
        </div>
      </InlineAccordion>
    </section>
  );
}
