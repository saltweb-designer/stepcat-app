"use client";

import { Fragment, useMemo, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useEntries } from "@/hooks/useEntries";
import { getCurrentWeekDates } from "@/lib/week";
import { getDatesWithEntries } from "@/lib/build-week-entries";
import { getHolidayName } from "@/lib/holidays";
import EntryFormModal from "@/components/entry-form/EntryFormModal";

/** 月が変わる1日だけ「12/1」のように月も出し、週をまたいでも何月か分かるようにする */
function dayNumber(iso: string) {
  const [, m, d] = iso.split("-").map(Number);
  return d === 1 ? `${m}/${d}` : d;
}

/** 今週に続けて横スクロールで見せる週。印と色で今週と区別する */
const WEEKS = [
  { label: "", tagClass: "", dayClass: "bg-white text-gray-700 shadow-sm hover:bg-gray-50" },
  { label: "来週", tagClass: "text-sky-600 border-sky-200", dayClass: "bg-sky-100 text-sky-900 hover:bg-sky-200" },
  { label: "再来週", tagClass: "text-violet-600 border-violet-200", dayClass: "bg-violet-100 text-violet-900 hover:bg-violet-200" },
];

/** 折りたたまれた過去アコーディオン等を開いてから、該当日のカードへスムーズスクロールする */
function scrollToDayCard(date: string) {
  const target = document.getElementById(`day-${date}`);
  if (!target) return false;

  let details = target.closest("details");
  while (details) {
    details.open = true;
    details = details.parentElement?.closest("details") ?? null;
  }
  target.scrollIntoView({ behavior: "smooth", block: "start" });
  return true;
}

export default function DateStrip() {
  const { user } = useAuth();
  const { entries } = useEntries(user?.uid);
  const weeks = useMemo(() => {
    const today = new Date();
    return WEEKS.map((week, i) => {
      const base = new Date(today);
      base.setDate(today.getDate() + i * 7);
      // 2週目以降は「今日」の印を付けないよう、日付だけ借りて isToday は外す
      const dates = getCurrentWeekDates(base).map((wd) => ({ ...wd, isToday: i === 0 && wd.isToday }));
      return { ...week, dates };
    });
  }, []);
  const datesWithEntries = useMemo(() => getDatesWithEntries(entries), [entries]);
  const [newEntryDate, setNewEntryDate] = useState<string | null>(null);

  /** タップした日のカードへスクロールする。カードが見つからない（読み込み中など）ときだけ追加画面を開く */
  const handleSelect = (date: string) => {
    if (scrollToDayCard(date)) return;
    setNewEntryDate(date);
  };

  return (
    <>
      {/* 1日分の幅は「(全幅 - 6つの隙間) / 7」にして、今週の7日がちょうど画面幅に収まるようにする */}
      <div className="flex snap-x snap-proximity gap-2 overflow-x-auto pb-0.5">
        {weeks.map((week) => (
          <Fragment key={week.dates[0].date}>
            {week.label && (
              <div
                className={`flex w-5 shrink-0 snap-start items-center justify-center border-l-2 text-[10px] font-bold tracking-widest [writing-mode:vertical-rl] ${week.tagClass}`}
              >
                {week.label}
              </div>
            )}
            {week.dates.map((wd, i) => {
              const holidayName = getHolidayName(wd.date);
              const hasEntries = datesWithEntries.has(wd.date);

              return (
                <button
                  key={wd.date}
                  type="button"
                  onClick={() => handleSelect(wd.date)}
                  className={`flex shrink-0 basis-[calc((100%-3rem)/7)] flex-col items-center gap-0.5 rounded-xl py-2 transition-colors ${
                    !week.label && i === 0 ? "snap-start" : ""
                  } ${
                    wd.isToday ? "bg-black text-white" : holidayName ? "bg-rose-50 text-rose-600" : week.dayClass
                  }`}
                >
                  <span className="text-[10px] font-medium opacity-70">{wd.dayLabel}</span>
                  <span className="text-sm font-bold">{dayNumber(wd.date)}</span>
                  <span
                    className={`h-1 w-1 rounded-full ${
                      hasEntries ? (wd.isToday ? "bg-white" : "bg-gray-900") : "bg-transparent"
                    }`}
                  />
                </button>
              );
            })}
          </Fragment>
        ))}
      </div>

      {newEntryDate && (
        <EntryFormModal initialDate={newEntryDate} onClose={() => setNewEntryDate(null)} />
      )}
    </>
  );
}
