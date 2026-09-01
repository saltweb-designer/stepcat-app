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

/** 睡眠時間（時・分） */
export interface SleepDuration {
  hours: number;
  minutes: number;
}

/** Firestore の users/{uid}/wellness/{date} ドキュメントの形（date = YYYY-MM-DD） */
export interface WellnessDoc {
  /** 朝の体重 */
  morningWeight: string;
  /** お通じの有無 */
  hasBowelMovement: boolean;
  /** 睡眠時間 */
  sleepHours: SleepDuration;
  /** むくみ */
  hasSwelling: boolean;
  swellingNote: string;
  /** 張り感 */
  hasTightness: boolean;
  tightnessNote: string;
  /** 疲労感 */
  hasFatigue: boolean;
  fatigueNote: string;
  /** 体調の変化 */
  hasConditionChange: boolean;
  conditionChangeNote: string;
  /** 水分摂取量（ミリリットル） */
  waterIntakeMl: number;
}

export const EMPTY_WELLNESS: WellnessDoc = {
  morningWeight: "",
  hasBowelMovement: false,
  sleepHours: { hours: 0, minutes: 0 },
  hasSwelling: false,
  swellingNote: "",
  hasTightness: false,
  tightnessNote: "",
  hasFatigue: false,
  fatigueNote: "",
  hasConditionChange: false,
  conditionChangeNote: "",
  waterIntakeMl: 0,
};

function isSleepDuration(value: unknown): value is SleepDuration {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof (value as SleepDuration).hours === "number" &&
    typeof (value as SleepDuration).minutes === "number"
  );
}

/** Firestore から読み込んだ生データを WellnessDoc に正規化する（旧形式の sleepHours: string からの移行を含む） */
export function normalizeWellnessDoc(raw: Record<string, unknown>): WellnessDoc {
  return {
    ...EMPTY_WELLNESS,
    ...raw,
    sleepHours: isSleepDuration(raw.sleepHours) ? raw.sleepHours : EMPTY_WELLNESS.sleepHours,
    waterIntakeMl: typeof raw.waterIntakeMl === "number" ? raw.waterIntakeMl : EMPTY_WELLNESS.waterIntakeMl,
  } as WellnessDoc;
}

/** 睡眠時間を「7時間30分」のような表示用文字列に変換する。未入力（0時間0分）の場合は空文字を返す */
export function formatSleepDuration(sleep: SleepDuration): string {
  if (sleep.hours === 0 && sleep.minutes === 0) return "";
  if (sleep.minutes === 0) return `${sleep.hours}時間`;
  return `${sleep.hours}時間${sleep.minutes}分`;
}

export interface ExternalApp {
  id: string;
  name: string;
  description: string;
  /** スマホ表示など、省スペース時に使う短縮ラベル */
  shortLabel: string;
  href: string;
  iconSrc: string;
}
