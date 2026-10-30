export const WEEK_MARK_COLORS = ["blue", "green"] as const;

export type WeekMarkColor = (typeof WEEK_MARK_COLORS)[number];

/** 今週（赤）と、自分で選んだ大事な週の色ごとの見た目 */
export const WEEK_BAND_STYLES: Record<
  "current" | WeekMarkColor,
  { label: string; box: string; row: string; swatch: string; goal: string }
> = {
  current: {
    label: "今週",
    box: "bg-red-50 ring-2 ring-red-400",
    row: "bg-red-50",
    swatch: "bg-red-400",
    goal: "bg-red-600 font-bold text-white hover:bg-red-700",
  },
  blue: {
    label: "青",
    box: "bg-blue-50 ring-2 ring-blue-400",
    row: "bg-blue-100",
    swatch: "bg-blue-400",
    goal: "bg-blue-600 font-bold text-white hover:bg-blue-700",
  },
  green: {
    label: "緑",
    box: "bg-emerald-50 ring-2 ring-emerald-400",
    row: "bg-emerald-100",
    swatch: "bg-emerald-400",
    goal: "bg-emerald-600 font-bold text-white hover:bg-emerald-700",
  },
};

/** 今日を含む週は、選んだ色より今週の赤を優先する */
export function getWeekBand(isCurrentWeek: boolean, markColor: WeekMarkColor | undefined) {
  if (isCurrentWeek) return WEEK_BAND_STYLES.current;
  return markColor ? WEEK_BAND_STYLES[markColor] : null;
}
