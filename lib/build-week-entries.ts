import type { DayEntry, EntryDoc, LinkItemType } from "./types";
import { enumerateDateRange, type WeekDate } from "./week";
import { getHolidayName } from "./holidays";

export function detectLinkType(href: string): LinkItemType {
  return /maps\.(google|apple)\.com|goo\.gl\/maps/i.test(href) ? "map" : "url";
}

export function formatPeriodLabel(startDate: string, endDate: string): string | undefined {
  if (startDate === endDate) return undefined;
  const format = (iso: string) => {
    const [, m, d] = iso.split("-");
    return `${Number(m)}/${Number(d)}`;
  };
  return `${format(startDate)}〜${format(endDate)}`;
}

type EntryBuckets = Pick<DayEntry, "schedules" | "tasks" | "memos" | "links">;

/** 指定した1日（ISO日付）に該当するエントリを、カテゴリ別のバケツに振り分ける */
function bucketEntriesForDate(date: string, entries: EntryDoc[]): EntryBuckets {
  const buckets: EntryBuckets = { schedules: [], tasks: [], memos: [], links: [] };

  for (const entry of entries) {
    const endDate = entry.endDate || entry.startDate;
    if (date < entry.startDate || date > endDate) continue;

    if (entry.category === "schedule") {
      buckets.schedules.push(entry);
    } else if (entry.category === "task") {
      buckets.tasks.push(entry);
    } else if (entry.category === "memo") {
      buckets.memos.push(entry);
    } else if (entry.category === "link" && entry.link) {
      buckets.links.push(entry);
    }

    // カテゴリを問わず、リンクが入力されていれば併せてチップ表示する
    if (entry.category !== "link" && entry.link) {
      buckets.links.push(entry);
    }
  }

  return buckets;
}

/**
 * ユーザーのフラットなエントリ一覧を、週の各曜日カード用の DayEntry[] に展開する。
 * 期間（startDate〜endDate）を持つエントリは、範囲内のすべての日のカードに現れる。
 */
export function buildWeekEntries(weekDates: WeekDate[], entries: EntryDoc[]): DayEntry[] {
  return weekDates.map((wd) => ({
    date: wd.date,
    dayLabel: wd.dayLabel,
    isToday: wd.isToday,
    holidayName: getHolidayName(wd.date),
    ...bucketEntriesForDate(wd.date, entries),
  }));
}

/** 週に限定しない、任意の1日分の DayEntry を組み立てる（カレンダーページ等で使用） */
export function buildDayEntry(
  date: string,
  dayLabel: string,
  isToday: boolean,
  entries: EntryDoc[]
): DayEntry {
  return {
    date,
    dayLabel,
    isToday,
    holidayName: getHolidayName(date),
    ...bucketEntriesForDate(date, entries),
  };
}

/** エントリが1件でも存在する日付（ISO文字列）の集合を返す */
export function getDatesWithEntries(entries: EntryDoc[]): Set<string> {
  const dates = new Set<string>();
  for (const entry of entries) {
    const endDate = entry.endDate || entry.startDate;
    for (const date of enumerateDateRange(entry.startDate, endDate)) {
      dates.add(date);
    }
  }
  return dates;
}
