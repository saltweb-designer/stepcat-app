"use client";

import { useEffect, useState } from "react";
import { doc, onSnapshot, serverTimestamp, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { DEFAULT_DAILY_UNAVOIDABLE, normalizeActionLogSettings } from "@/lib/action-log";
import type { ActionLogSettingsDoc } from "@/lib/types";
import { toIsoDate } from "@/lib/week";

/** 「毎日の不可避」設定を購読する。未設定の場合は初期値（今日から適用）を保存する */
export function useActionLogSettings(uid: string | undefined) {
  const [settings, setSettings] = useState<ActionLogSettingsDoc | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!uid) return;

    const ref = doc(db, "users", uid, "settings", "actionLog");
    const unsubscribe = onSnapshot(
      ref,
      (snapshot) => {
        const next = snapshot.exists() ? normalizeActionLogSettings(snapshot.data()) : null;
        if (!next && !snapshot.metadata.hasPendingWrites) {
          setDoc(
            ref,
            {
              dailyUnavoidable: DEFAULT_DAILY_UNAVOIDABLE,
              dailyUnavoidableSince: toIsoDate(new Date()),
              updatedAt: serverTimestamp(),
            },
            { merge: true }
          ).catch((err) => console.error("毎日の不可避の初期設定に失敗しました", err));
        }
        setSettings(next);
        setLoading(false);
      },
      (err) => {
        console.error("毎日の不可避の取得に失敗しました", err);
        setLoading(false);
      }
    );

    return unsubscribe;
  }, [uid]);

  const saveDailyUnavoidable = async (items: string[]) => {
    if (!uid) return;
    await setDoc(
      doc(db, "users", uid, "settings", "actionLog"),
      { dailyUnavoidable: items, updatedAt: serverTimestamp() },
      { merge: true }
    );
  };

  const saveSelfPresets = async (items: string[]) => {
    if (!uid) return;
    await setDoc(
      doc(db, "users", uid, "settings", "actionLog"),
      { selfPresets: items, updatedAt: serverTimestamp() },
      { merge: true }
    );
  };

  return uid
    ? { settings, loading, saveDailyUnavoidable, saveSelfPresets }
    : { settings: null, loading: false, saveDailyUnavoidable: async () => {}, saveSelfPresets: async () => {} };
}
