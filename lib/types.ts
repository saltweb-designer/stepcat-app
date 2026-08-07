export type EntryCategory = "schedule" | "task" | "memo" | "link";

export type LinkItemType = "url" | "map";

/** Firestore の users/{uid}/entries/{id} ドキュメントの形 */
export interface EntryDoc {
  id: string;
  category: EntryCategory;
  title: string;
  detail: string;
  link: string;
  /** ISO date string (YYYY-MM-DD) */
  startDate: string;
  /** ISO date string (YYYY-MM-DD) */
  endDate: string;
  allDay: boolean;
  startTime: string;
  endTime: string;
  /** category="task" の場合、完了した日付（YYYY-MM-DD）の一覧。日ごとに独立して完了状態を管理する */
  completedDates: string[];
}

export interface DayEntry {
  /** ISO date string (YYYY-MM-DD) */
  date: string;
  /** 月, 火, 水... */
  dayLabel: string;
  isToday?: boolean;
  /** 祝日名。将来的には祝日APIから自動取得予定 */
  holidayName?: string;
  schedules: EntryDoc[];
  tasks: EntryDoc[];
  memos: EntryDoc[];
  links: EntryDoc[];
}

export interface ExternalApp {
  id: string;
  name: string;
  description: string;
  href: string;
  iconSrc: string;
}
