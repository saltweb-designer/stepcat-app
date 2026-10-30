"use client";

import { useEffect, useState } from "react";
import { deleteField, doc, onSnapshot, serverTimestamp, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { WEEK_MARK_COLORS, type WeekMarkColor } from "@/lib/week-colors";

function normalizeColors(raw: unknown): Record<string, WeekMarkColor> {
  if (!raw || typeof raw !== "object") return {};
  const result: Record<string, WeekMarkColor> = {};
  for (const [weekStart, color] of Object.entries(raw)) {
    if (WEEK_MARK_COLORS.includes(color as WeekMarkColor)) result[weekStart] = color as WeekMarkColor;
  }
  return result;
}

function normalizeGoalDates(raw: unknown): Set<string> {
  if (!raw || typeof raw !== "object") return new Set();
  return new Set(Object.keys(raw).filter((date) => (raw as Record<string, unknown>)[date] === true));
}

/** 大事な予定の週につけた色（週の月曜日の日付 → 色）と、その週の目的の日を購読する */
export function useWeekColors(uid: string | undefined) {
  const [colors, setColors] = useState<Record<string, WeekMarkColor>>({});
  const [goalDates, setGoalDates] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!uid) return;

    const ref = doc(db, "users", uid, "settings", "weekColors");
    const unsubscribe = onSnapshot(
      ref,
      (snapshot) => {
        const data = snapshot.exists() ? snapshot.data() : {};
        setColors(normalizeColors(data.colors));
        setGoalDates(normalizeGoalDates(data.goalDates));
      },
      (err) => console.error("週の色の取得に失敗しました", err)
    );

    return unsubscribe;
  }, [uid]);

  /** color に null を渡すと、その週の色を外す。色を外すときは、その週の目的の日もあわせて外す */
  const saveWeekColor = async (weekDates: string[], color: WeekMarkColor | null) => {
    if (!uid) return;
    await setDoc(
      doc(db, "users", uid, "settings", "weekColors"),
      {
        colors: { [weekDates[0]]: color ?? deleteField() },
        ...(color ? {} : { goalDates: Object.fromEntries(weekDates.map((date) => [date, deleteField()])) }),
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
  };

  const toggleGoalDate = async (date: string) => {
    if (!uid) return;
    await setDoc(
      doc(db, "users", uid, "settings", "weekColors"),
      { goalDates: { [date]: goalDates.has(date) ? deleteField() : true }, updatedAt: serverTimestamp() },
      { merge: true }
    );
  };

  return uid
    ? { colors, goalDates, saveWeekColor, toggleGoalDate }
    : { colors: {}, goalDates: new Set<string>(), saveWeekColor: async () => {}, toggleGoalDate: async () => {} };
}
