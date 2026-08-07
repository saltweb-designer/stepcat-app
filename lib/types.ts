export type ScheduleTiming =
  | { kind: "all-day" }
  | { kind: "time"; start: string; end?: string };

export interface Schedule {
  id: string;
  title: string;
  /** 例: "8/4〜8/8" のような期間表示。単日の場合は undefined */
  periodLabel?: string;
  timing: ScheduleTiming;
}

export interface Task {
  id: string;
  title: string;
  done: boolean;
}

export type LinkItemType = "url" | "map";

export interface LinkItem {
  id: string;
  type: LinkItemType;
  label: string;
  href: string;
}

export interface MemoItem {
  id: string;
  text: string;
}

export interface DayEntry {
  /** ISO date string (YYYY-MM-DD) */
  date: string;
  /** 月, 火, 水... */
  dayLabel: string;
  isToday?: boolean;
  /** 祝日名。将来的には祝日APIから自動取得予定 */
  holidayName?: string;
  schedules: Schedule[];
  tasks: Task[];
  memos: MemoItem[];
  links: LinkItem[];
}

export interface ExternalApp {
  id: string;
  name: string;
  description: string;
  href: string;
  iconSrc: string;
}

export type EntryCategory = "schedule" | "task" | "memo" | "link";

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
  done: boolean;
}

