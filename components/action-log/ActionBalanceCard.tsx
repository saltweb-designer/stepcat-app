"use client";

import { useState } from "react";
import { Scale } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useActionLogRange } from "@/hooks/useActionLogRange";
import { useActionLogSettings } from "@/hooks/useActionLogSettings";
import { toIsoDate } from "@/lib/week";
import { ACTION_ORIGINS, buildBalanceMessage, countActions } from "@/lib/action-log";

export interface BalancePeriod {
  label: string;
  /** YYYY-MM-DD */
  startDate: string;
  /** YYYY-MM-DD */
  endDate: string;
}

/** 期間内の「自分起点・他人起点・不可避」の件数を比較して表示する */
export default function ActionBalanceCard({ periods }: { periods: BalancePeriod[] }) {
  const { user } = useAuth();
  const [periodIndex, setPeriodIndex] = useState(0);
  const period = periods[periodIndex] ?? periods[0];
  const { logs, loading: logsLoading, error } = useActionLogRange(user?.uid, period.startDate, period.endDate);
  const { settings, loading: settingsLoading } = useActionLogSettings(user?.uid);
  const loading = logsLoading || settingsLoading;

  const counts = countActions(logs, settings, period.startDate, period.endDate, toIsoDate(new Date()));
  const total = counts.self + counts.others + counts.unavoidable;

  return (
    <section className="rounded-2xl bg-white p-4 shadow-sm sm:p-5">
      <div className="flex items-center justify-between gap-2">
        <h2 className="flex items-center gap-1.5 text-sm font-bold text-gray-900">
          <Scale className="h-4 w-4 text-gray-500" strokeWidth={2} />
          行動の起点バランス
        </h2>
        {periods.length > 1 ? (
          <div className="flex rounded-full bg-gray-100 p-0.5">
            {periods.map((p, index) => (
              <button
                key={p.label}
                type="button"
                onClick={() => setPeriodIndex(index)}
                className={`rounded-full px-3 py-1 text-[11px] font-semibold transition-colors ${
                  index === periodIndex ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        ) : (
          <span className="text-xs font-semibold text-gray-400">{period.label}</span>
        )}
      </div>

      {error ? (
        <p className="mt-3 text-sm font-semibold text-rose-500">{error}</p>
      ) : loading ? (
        <div className="mt-3 h-3 w-full animate-pulse rounded-full bg-gray-100" />
      ) : (
        <>
          <div className="mt-3 flex h-3 w-full overflow-hidden rounded-full bg-gray-100">
            {total > 0 &&
              ACTION_ORIGINS.map((origin) =>
                counts[origin.key] > 0 ? (
                  <div
                    key={origin.key}
                    className={origin.barClass}
                    style={{ width: `${(counts[origin.key] / total) * 100}%` }}
                  />
                ) : null
              )}
          </div>

          <dl className="mt-3 grid grid-cols-3 gap-2">
            {ACTION_ORIGINS.map((origin) => (
              <div key={origin.key} className={`rounded-xl px-2.5 py-2 ${origin.boxClass}`}>
                <dt className={`flex items-center gap-1 text-[11px] font-bold ${origin.textClass}`}>
                  <span className={`h-2 w-2 shrink-0 rounded-full ${origin.dotClass}`} />
                  {origin.label}
                </dt>
                <dd className="mt-0.5 text-lg font-bold text-gray-900">
                  {counts[origin.key]}
                  <span className="ml-0.5 text-xs font-semibold text-gray-500">件</span>
                  {total > 0 && (
                    <span className="ml-1 text-[11px] font-semibold text-gray-400">
                      {Math.round((counts[origin.key] / total) * 100)}%
                    </span>
                  )}
                </dd>
              </div>
            ))}
          </dl>

          <p className="mt-3 text-xs font-semibold text-gray-600">{buildBalanceMessage(counts)}</p>
        </>
      )}
    </section>
  );
}
