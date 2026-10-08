import type { EntryDoc } from "./types";
import { enumerateDateRange, toIsoDate } from "./week";

/** 曜日選択UIの並び順（月始まり）。value は Date#getDay() の値 */
export const WEEKDAY_OPTIONS: { value: number; label: string }[] = [
  { value: 1, label: "月" },
  { value: 2, label: "火" },
  { value: 3, label: "水" },
  { value: 4, label: "木" },
  { value: 5, label: "金" },
  { value: 6, label: "土" },
  { value: 0, label: "日" },
];

/** 編集・削除を「どの範囲に反映するか」 */
export type EditScope = "single" | "following" | "all";

export function addDays(iso: string, days: number): string {
  const d = new Date(`${iso}T00:00:00`);
  d.setDate(d.getDate() + days);
  return toIsoDate(d);
}

export function getWeekday(iso: string): number {
  return new Date(`${iso}T00:00:00`).getDay();
}

/** 複数日にまたがる（期間・曜日指定の）エントリかどうか */
export function isSeriesEntry(entry: Pick<EntryDoc, "startDate" | "endDate">): boolean {
  return (entry.endDate || entry.startDate) !== entry.startDate;
}

/** 期間・曜日指定・除外日を考慮して、エントリが指定日に表示されるかを判定する */
export function occursOn(
  entry: Pick<EntryDoc, "startDate" | "endDate" | "weekdays" | "excludedDates">,
  date: string
): boolean {
  const endDate = entry.endDate || entry.startDate;
  if (date < entry.startDate || date > endDate) return false;
  if (entry.excludedDates.includes(date)) return false;
  if (entry.weekdays.length > 0 && !entry.weekdays.includes(getWeekday(date))) return false;
  return true;
}

/** エントリが実際に表示される日付の一覧 */
export function listOccurrences(
  entry: Pick<EntryDoc, "startDate" | "endDate" | "weekdays" | "excludedDates">
): string[] {
  return enumerateDateRange(entry.startDate, entry.endDate || entry.startDate).filter((date) =>
    occursOn(entry, date)
  );
}

/** 「毎週 月・水」のような曜日指定の表示用ラベル。曜日指定がなければ undefined */
export function formatWeekdaysLabel(weekdays: number[]): string | undefined {
  if (weekdays.length === 0 || weekdays.length === 7) return undefined;
  const labels = WEEKDAY_OPTIONS.filter((o) => weekdays.includes(o.value)).map((o) => o.label);
  return `毎週 ${labels.join("・")}`;
}
