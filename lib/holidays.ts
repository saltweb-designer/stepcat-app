/**
 * 祝日のダミーデータ。将来的には祝日APIから自動取得予定。
 */
const HOLIDAYS: Record<string, string> = {
  "2026-08-08": "山の日",
};

export function getHolidayName(date: string): string | undefined {
  return HOLIDAYS[date];
}
