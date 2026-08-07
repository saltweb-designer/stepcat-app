"use client";

import { useEffect, useState } from "react";
import { doc, onSnapshot, serverTimestamp, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

export function useWeekSummary(uid: string | undefined, weekStartDate: string) {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!uid) return;

    const ref = doc(db, "users", uid, "weekSummaries", weekStartDate);
    const unsubscribe = onSnapshot(
      ref,
      (snapshot) => {
        setText(snapshot.exists() ? (snapshot.data().text ?? "") : "");
        setLoading(false);
      },
      (error) => {
        console.error("今週の概要の取得に失敗しました", error);
        setLoading(false);
      }
    );

    return unsubscribe;
  }, [uid, weekStartDate]);

  const saveSummary = async (nextText: string) => {
    if (!uid) return;
    await setDoc(
      doc(db, "users", uid, "weekSummaries", weekStartDate),
      { text: nextText, updatedAt: serverTimestamp() },
      { merge: true }
    );
  };

  return uid ? { text, loading, saveSummary } : { text: "", loading: false, saveSummary: async () => {} };
}
