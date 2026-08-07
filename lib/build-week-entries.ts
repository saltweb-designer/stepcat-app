import type { DayEntry, EntryDoc, LinkItemType } from "./types";
import { enumerateDateRange, type WeekDate } from "./week";
import { getHolidayName } from "./holidays";

function detectLinkType(href: string): LinkItemType {
  return /maps\.(google|apple)\.com|goo\.gl\/maps/i.test(href) ? "map" : "url";
}

function formatPeriodLabel(startDate: string, endDate: string): string | undefined {
  if (startDate === endDate) return undefined;
  const format = (iso: string) => {
    const [, m, d] = iso.split("-");
    return `${Number(m)}/${Number(d)}`;
  };
  return `${format(startDate)}〜${format(endDate)}`;
}

/**
 * ユーザーのフラットなエントリ一覧を、週の各曜日カード用の DayEntry[] に展開する。
 * 期間（startDate〜endDate）を持つエントリは、範囲内のすべての日のカードに現れる。
 */
export function buildWeekEntries(weekDates: WeekDate[], entries: EntryDoc[]): DayEntry[] {
  const byDate = new Map<string, DayEntry>();

  for (const wd of weekDates) {
    byDate.set(wd.date, {
      date: wd.date,
      dayLabel: wd.dayLabel,
      isToday: wd.isToday,
      holidayName: getHolidayName(wd.date),
      schedules: [],
      tasks: [],
      memos: [],
      links: [],
    });
  }

  for (const entry of entries) {
    const endDate = entry.endDate || entry.startDate;
    const periodLabel = formatPeriodLabel(entry.startDate, endDate);
    const datesInRange = enumerateDateRange(entry.startDate, endDate);

    for (const date of datesInRange) {
      const day = byDate.get(date);
      if (!day) continue; // 今週の範囲外

      if (entry.category === "schedule") {
        day.schedules.push({
          id: entry.id,
          title: entry.title,
          periodLabel,
          timing: entry.allDay
            ? { kind: "all-day" }
            : { kind: "time", start: entry.startTime, end: entry.endTime || undefined },
        });
      } else if (entry.category === "task") {
        day.tasks.push({ id: entry.id, title: entry.title, done: entry.done });
      } else if (entry.category === "memo") {
        day.memos.push({ id: entry.id, text: entry.detail || entry.title });
      } else if (entry.category === "link" && entry.link) {
        day.links.push({
          id: entry.id,
          type: detectLinkType(entry.link),
          label: entry.title || entry.link,
          href: entry.link,
        });
      }

      // カテゴリを問わず、リンクが入力されていれば併せてチップ表示する
      if (entry.category !== "link" && entry.link) {
        day.links.push({
          id: `${entry.id}-link`,
          type: detectLinkType(entry.link),
          label: entry.title || entry.link,
          href: entry.link,
        });
      }
    }
  }

  return weekDates.map((wd) => byDate.get(wd.date)!);
}
