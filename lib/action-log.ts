import type { ActionItem, ActionLogDoc, ActionLogSettingsDoc, ActionOrigin } from "./types";
import { enumerateDateRange } from "./week";

export const ACTION_ORIGINS: {
  key: ActionOrigin;
  label: string;
  description: string;
  placeholder: string;
  /** リスト背景・文字色 */
  boxClass: string;
  textClass: string;
  /** 集計バーの色 */
  barClass: string;
  dotClass: string;
}[] = [
  {
    key: "self",
    label: "自分起点",
    description: "自分がやりたい・進めたいこと",
    placeholder: "例：アプリ開発、筋トレ",
    boxClass: "bg-emerald-50",
    textClass: "text-emerald-700",
    barClass: "bg-emerald-500",
    dotClass: "bg-emerald-500",
  },
  {
    key: "others",
    label: "他人起点",
    description: "他者の要求で行った行動",
    placeholder: "例：急な連絡の対応、打ち合わせ",
    boxClass: "bg-amber-50",
    textClass: "text-amber-700",
    barClass: "bg-amber-400",
    dotClass: "bg-amber-400",
  },
  {
    key: "unavoidable",
    label: "不可避",
    description: "簡単に避けられない日々の行動",
    placeholder: "例：睡眠、通勤、掃除",
    boxClass: "bg-slate-100",
    textClass: "text-slate-600",
    barClass: "bg-slate-400",
    dotClass: "bg-slate-400",
  },
];

function normalizeItems(value: unknown): ActionItem[] {
  if (!Array.isArray(value)) return [];
  return value.filter(
    (item): item is ActionItem =>
      typeof item === "object" && item !== null && typeof item.id === "string" && typeof item.text === "string"
  );
}

export function normalizeActionLogDoc(date: string, raw: Record<string, unknown>): ActionLogDoc {
  return {
    date,
    self: normalizeItems(raw.self),
    others: normalizeItems(raw.others),
    unavoidable: Array.isArray(raw.unavoidable) ? normalizeItems(raw.unavoidable) : null,
  };
}

/** 初めて使うときの「毎日の不可避」 */
export const DEFAULT_DAILY_UNAVOIDABLE = ["睡眠", "洗濯", "料理"];

export function normalizeActionLogSettings(raw: Record<string, unknown>): ActionLogSettingsDoc | null {
  if (!Array.isArray(raw.dailyUnavoidable) || typeof raw.dailyUnavoidableSince !== "string") return null;
  return {
    dailyUnavoidable: raw.dailyUnavoidable.filter((text): text is string => typeof text === "string"),
    dailyUnavoidableSince: raw.dailyUnavoidableSince,
  };
}

/** 「毎日の不可避」から作る項目。id は日付内で一意になれば十分 */
export function buildDailyUnavoidableItems(settings: ActionLogSettingsDoc | null, date: string): ActionItem[] {
  if (!settings || date < settings.dailyUnavoidableSince) return [];
  return settings.dailyUnavoidable.map((text, index) => ({ id: `daily-${index}`, text }));
}

/** その日に表示・集計する項目。不可避を個別に編集していない日は「毎日の不可避」を使う */
export function resolveActionItems(
  log: ActionLogDoc | null,
  origin: ActionOrigin,
  settings: ActionLogSettingsDoc | null,
  date: string
): { items: ActionItem[]; isDaily: boolean } {
  if (origin !== "unavoidable") return { items: log?.[origin] ?? [], isDaily: false };
  if (log?.unavoidable) return { items: log.unavoidable, isDaily: false };
  return { items: buildDailyUnavoidableItems(settings, date), isDaily: true };
}

export type ActionCounts = Record<ActionOrigin, number>;

export const EMPTY_ACTION_COUNTS: ActionCounts = { self: 0, others: 0, unavoidable: 0 };

/**
 * startDate〜endDate の件数を数える。「毎日の不可避」は今日までの日だけ数える（未来の日はまだ行動していないため）
 */
export function countActions(
  logs: ActionLogDoc[],
  settings: ActionLogSettingsDoc | null,
  startDate: string,
  endDate: string,
  today: string
): ActionCounts {
  const logByDate = new Map(logs.map((log) => [log.date, log]));
  const counts = { ...EMPTY_ACTION_COUNTS };
  for (const date of enumerateDateRange(startDate, endDate)) {
    const log = logByDate.get(date) ?? null;
    counts.self += log?.self.length ?? 0;
    counts.others += log?.others.length ?? 0;
    if (log?.unavoidable) counts.unavoidable += log.unavoidable.length;
    else if (date <= today) counts.unavoidable += buildDailyUnavoidableItems(settings, date).length;
  }
  return counts;
}

/** 自分起点と他人起点の比較から振り返りメッセージを作る */
export function buildBalanceMessage(counts: ActionCounts): string {
  if (counts.self === 0 && counts.others === 0) return "まだ記録がありません";
  if (counts.self > counts.others) return `自分起点が他人起点より${counts.self - counts.others}件多い。自分の時間を確保できています`;
  if (counts.self < counts.others) return `他人起点が自分起点より${counts.others - counts.self}件多い。自分の時間を確保できているか見直してみましょう`;
  return "自分起点と他人起点が同じ件数です";
}
