const DAY_LABELS = ["日", "月", "火", "水", "木", "金", "土"];

export function getDayLabel(iso: string): string {
  return DAY_LABELS[new Date(`${iso}T00:00:00`).getDay()];
}

export interface WeekDate {
  date: string;
  dayLabel: string;
  isToday: boolean;
}

export function toIsoDate(d: Date) {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/** 今日を含む週の月〜日を返す */
export function getCurrentWeekDates(today: Date = new Date()): WeekDate[] {
  const todayIso = toIsoDate(today);
  const dayOfWeek = today.getDay(); // 0=日, 1=月, ... 6=土
  const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;

  const monday = new Date(today);
  monday.setHours(0, 0, 0, 0);
  monday.setDate(monday.getDate() + diffToMonday);

  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    const iso = toIsoDate(d);
    return {
      date: iso,
      dayLabel: DAY_LABELS[d.getDay()],
      isToday: iso === todayIso,
    };
  });
}

export function formatWeekPeriodLabel(weekDates: WeekDate[]) {
  if (weekDates.length === 0) return "";
  const first = weekDates[0].date;
  const last = weekDates[weekDates.length - 1].date;
  const format = (iso: string) => {
    const [, m, d] = iso.split("-");
    return `${Number(m)}/${Number(d)}`;
  };
  return `${format(first)}〜${format(last)}`;
}

/** date1 <= date2 の日付範囲 [date1, date2] を1日ずつ列挙する（ISO文字列の比較で十分） */
export function enumerateDateRange(startDate: string, endDate: string): string[] {
  const dates: string[] = [];
  const start = new Date(`${startDate}T00:00:00`);
  const end = new Date(`${endDate}T00:00:00`);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || start > end) {
    return [startDate];
  }
  const cursor = new Date(start);
  while (cursor <= end) {
    dates.push(toIsoDate(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }
  return dates;
}
