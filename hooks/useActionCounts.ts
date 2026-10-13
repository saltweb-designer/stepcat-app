"use client";

import { useActionLogRange } from "./useActionLogRange";
import { useActionLogSettings } from "./useActionLogSettings";
import { countActions } from "@/lib/action-log";
import { toIsoDate } from "@/lib/week";

/** startDate〜endDate の「自分起点・他人起点・不可避」の件数（毎日の不可避を含む） */
export function useActionCounts(uid: string | undefined, startDate: string, endDate: string) {
  const { logs, loading: logsLoading, error } = useActionLogRange(uid, startDate, endDate);
  const { settings, loading: settingsLoading } = useActionLogSettings(uid);
  const counts = countActions(logs, settings, startDate, endDate, toIsoDate(new Date()));
  return { counts, loading: logsLoading || settingsLoading, error };
}
