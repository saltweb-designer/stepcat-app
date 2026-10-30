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
  /** 期間内で表示する曜日（0=日〜6=土）。空配列の場合は期間内の毎日 */
  weekdays: number[];
  /** シリーズから除外した日付（YYYY-MM-DD）。「この日のみ」の編集・削除で使用する */
  excludedDates: string[];
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

/** 水分補給の保存履歴（保存ボタンを押した時点の時刻と、その時の増減量） */
export interface WaterLogEntry {
  /** 保存した時刻（HH:mm） */
  time: string;
  /** 前回保存時からの増減量（ミリリットル） */
  deltaMl: number;
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
  /** 水分補給の保存履歴 */
  waterLog: WaterLogEntry[];
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
  waterLog: [],
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
    waterLog: Array.isArray(raw.waterLog) ? raw.waterLog : EMPTY_WELLNESS.waterLog,
  } as WellnessDoc;
}

/** 睡眠時間を「7時間30分」のような表示用文字列に変換する。未入力（0時間0分）の場合は空文字を返す */
export function formatSleepDuration(sleep: SleepDuration): string {
  if (sleep.hours === 0 && sleep.minutes === 0) return "";
  if (sleep.minutes === 0) return `${sleep.hours}時間`;
  return `${sleep.hours}時間${sleep.minutes}分`;
}

/** Firestore の users/{uid}/dayPhotos/{id} ドキュメントの形。1枚ごとに1ドキュメント（1MB上限を日単位で共有しないため） */
export interface DayPhotoDoc {
  id: string;
  /** ISO date string (YYYY-MM-DD) */
  date: string;
  /** 圧縮済み JPEG の data URL */
  dataUrl: string;
  /** 並び順用の作成時刻（ミリ秒） */
  createdAtMs: number;
}

/** Firestore の users/{uid}/noteCategories/{id} ドキュメントの形 */
export interface NoteCategoryDoc {
  id: string;
  name: string;
  /** 表示順（小さいほど先頭） */
  order: number;
}

/** Firestore の users/{uid}/notes/{id} ドキュメントの形。日付に紐づかない自由なノート */
export interface NoteDoc {
  id: string;
  /** NoteCategoryDoc.id への参照。空文字、または削除済みカテゴリを指す場合は未分類として扱う */
  categoryId: string;
  text: string;
  /** ピン留めしたノートは一覧の一番上に表示する */
  pinned: boolean;
}

/** Firestore の users/{uid}/appLinks/{id} ドキュメントの形。ユーザーが自由に登録する関連アプリ */
export interface AppLinkDoc {
  id: string;
  name: string;
  href: string;
  /** アイコン画像のURL。空文字の場合はサイトのファビコンを使う */
  iconUrl: string;
  /** 表示順（小さいほど先頭） */
  order: number;
}

/** 行動の起点。自分起点＝自分がやりたい・進めたいこと、他人起点＝他者の要求による行動、不可避＝睡眠や通勤など避けられない行動 */
export type ActionOrigin = "self" | "others" | "unavoidable";

export interface ActionItem {
  id: string;
  text: string;
}

/** Firestore の users/{uid}/actionLogs/{date} ドキュメントの形（date = YYYY-MM-DD） */
export interface ActionLogDoc {
  /** 期間検索用に日付をフィールドとしても持つ */
  date: string;
  self: ActionItem[];
  others: ActionItem[];
  /** null の場合はその日を個別に編集しておらず、「毎日の不可避」設定を使う */
  unavoidable: ActionItem[] | null;
}

/** Firestore の users/{uid}/settings/actionLog ドキュメントの形 */
export interface ActionLogSettingsDoc {
  /** 毎日の不可避として自動で入る項目 */
  dailyUnavoidable: string[];
  /** 毎日の不可避を適用し始めた日（YYYY-MM-DD）。これより前の日には適用しない */
  dailyUnavoidableSince: string;
  /** 自分起点を追加するときに選べる、よく使う項目 */
  selfPresets: string[];
}

/** Firestore の users/{uid}/videos/{id} ドキュメントの形。動画ページに登録した YouTube 動画 */
export interface VideoDoc {
  id: string;
  url: string;
  /** 動画タイトル（URL から自動取得） */
  title: string;
  /** YouTube のチャンネル（アカウント）名。URL から自動取得し、手動で修正もできる */
  channelName: string;
  /** チャンネルページの URL。チャンネル一覧で同じアカウントをまとめるキーに使う */
  channelUrl: string;
  /** チャンネルのアイコン画像 URL。取得できなかった場合は空文字 */
  channelIconUrl: string;
  /** users/{uid}/videoCategories/{id} への参照。空文字、または削除済みカテゴリを指す場合は未分類として扱う */
  categoryId: string;
  memo: string;
  /** ピン留めした動画は一覧の先頭に固定表示する */
  pinned: boolean;
}

/** ピン留めは入力フォームとは別にカード上で切り替えるので、入力値には含めない */
export type VideoInput = Omit<VideoDoc, "id" | "pinned">;
