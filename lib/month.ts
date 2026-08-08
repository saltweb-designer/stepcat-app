import { toIsoDate } from "./week";

export interface MonthCell {
  date: string;
  day: number;
  inCurrentMonth: boolean;
  isToday: boolean;
}

/**
 * 指定した年月（month: 1〜12）の月間カレンダーを、月曜始まりの週の配列として返す。
 * 前後の月の日付でグリッドの隙間を埋める。
 */
export function getMonthGrid(year: number, month: number, today: Date = new Date()): MonthCell[][] {
  const todayIso = toIsoDate(today);
  const firstOfMonth = new Date(year, month - 1, 1);
  const daysInMonth = new Date(year, month, 0).getDate();
  const startWeekday = firstOfMonth.getDay(); // 0=日, 1=月, ...
  const mondayOffset = startWeekday === 0 ? 6 : startWeekday - 1;
  const totalCells = Math.ceil((mondayOffset + daysInMonth) / 7) * 7;

  const gridStart = new Date(firstOfMonth);
  gridStart.setDate(gridStart.getDate() - mondayOffset);

  const cells: MonthCell[] = Array.from({ length: totalCells }, (_, i) => {
    const d = new Date(gridStart);
    d.setDate(gridStart.getDate() + i);
    const iso = toIsoDate(d);
    return {
      date: iso,
      day: d.getDate(),
      inCurrentMonth: d.getMonth() === month - 1,
      isToday: iso === todayIso,
    };
  });

  const weeks: MonthCell[][] = [];
  for (let i = 0; i < cells.length; i += 7) {
    weeks.push(cells.slice(i, i + 7));
  }
  return weeks;
}
