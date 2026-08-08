"use client";

import { useMemo, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useEntries } from "@/hooks/useEntries";
import { getCurrentWeekDates } from "@/lib/week";
import { getDatesWithEntries } from "@/lib/build-week-entries";
import { getHolidayName } from "@/lib/holidays";
import EntryFormModal from "@/components/entry-form/EntryFormModal";

function dayNumber(iso: string) {
  return Number(iso.split("-")[2]);
}

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
  const weekDates = useMemo(() => getCurrentWeekDates(), []);
  const datesWithEntries = useMemo(() => getDatesWithEntries(entries), [entries]);
  const [newEntryDate, setNewEntryDate] = useState<string | null>(null);

  const handleSelect = (date: string) => {
    if (datesWithEntries.has(date) && scrollToDayCard(date)) return;
    setNewEntryDate(date);
  };

  return (
    <>
      <div className="flex gap-2 overflow-x-auto pb-0.5">
        {weekDates.map((wd) => {
          const holidayName = getHolidayName(wd.date);
          const hasEntries = datesWithEntries.has(wd.date);

          return (
            <button
              key={wd.date}
              type="button"
              onClick={() => handleSelect(wd.date)}
              className={`flex min-w-[3rem] flex-1 flex-col items-center gap-0.5 rounded-xl py-2 transition-colors ${
                wd.isToday
                  ? "bg-black text-white"
                  : holidayName
                    ? "bg-rose-50 text-rose-600"
                    : "bg-white text-gray-700 shadow-sm hover:bg-gray-50"
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
      </div>

      {newEntryDate && (
        <EntryFormModal initialDate={newEntryDate} onClose={() => setNewEntryDate(null)} />
      )}
    </>
  );
}
