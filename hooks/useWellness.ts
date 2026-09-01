"use client";

import { useEffect, useState } from "react";
import { doc, onSnapshot, serverTimestamp, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { EMPTY_WELLNESS, type WellnessDoc } from "@/lib/types";

export function useWellness(uid: string | undefined, date: string) {
  const [data, setData] = useState<WellnessDoc | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!uid) return;

    const ref = doc(db, "users", uid, "wellness", date);
    const unsubscribe = onSnapshot(
      ref,
      (snapshot) => {
        setData(snapshot.exists() ? ({ ...EMPTY_WELLNESS, ...snapshot.data() } as WellnessDoc) : null);
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.error("体調記録の取得に失敗しました", err);
        setError(
          err.code === "permission-denied"
            ? "アクセス権限がありません。Firestoreのセキュリティルールをご確認ください。"
            : "体調記録の取得に失敗しました。"
        );
        setLoading(false);
      }
    );

    return unsubscribe;
  }, [uid, date]);

  const saveWellness = async (next: WellnessDoc) => {
    if (!uid) return;
    await setDoc(
      doc(db, "users", uid, "wellness", date),
      { ...next, updatedAt: serverTimestamp() },
      { merge: true }
    );
  };

  return uid
    ? { data, loading, error, saveWellness }
    : { data: null, loading: false, error: null, saveWellness: async () => {} };
}
