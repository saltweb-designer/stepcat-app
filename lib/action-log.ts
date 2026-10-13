import type { ActionItem, ActionLogDoc, ActionOrigin } from "./types";

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
    unavoidable: normalizeItems(raw.unavoidable),
  };
}

export type ActionCounts = Record<ActionOrigin, number>;

export const EMPTY_ACTION_COUNTS: ActionCounts = { self: 0, others: 0, unavoidable: 0 };

export function countActions(logs: ActionLogDoc[]): ActionCounts {
  return logs.reduce<ActionCounts>(
    (acc, log) => ({
      self: acc.self + log.self.length,
      others: acc.others + log.others.length,
      unavoidable: acc.unavoidable + log.unavoidable.length,
    }),
    { ...EMPTY_ACTION_COUNTS }
  );
}

/** 自分起点と他人起点の比較から振り返りメッセージを作る */
export function buildBalanceMessage(counts: ActionCounts): string {
  if (counts.self === 0 && counts.others === 0) return "まだ記録がありません";
  if (counts.self > counts.others) return `自分起点が他人起点より${counts.self - counts.others}件多い。自分の時間を確保できています`;
  if (counts.self < counts.others) return `他人起点が自分起点より${counts.others - counts.self}件多い。自分の時間を確保できているか見直してみましょう`;
  return "自分起点と他人起点が同じ件数です";
}
