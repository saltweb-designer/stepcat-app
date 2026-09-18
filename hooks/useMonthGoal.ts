"use client";

import { useEffect, useState } from "react";
import { deleteDoc, doc, onSnapshot, serverTimestamp, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

export function useMonthGoal(uid: string | undefined, monthKey: string) {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!uid) return;

    const ref = doc(db, "users", uid, "monthGoals", monthKey);
    const unsubscribe = onSnapshot(
      ref,
      (snapshot) => {
        setText(snapshot.exists() ? (snapshot.data().text ?? "") : "");
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.error("月の目標の取得に失敗しました", err);
        setError(
          err.code === "permission-denied"
            ? "アクセス権限がありません。Firestoreのセキュリティルールをご確認ください。"
            : "月の目標の取得に失敗しました。"
        );
        setLoading(false);
      }
    );

    return unsubscribe;
  }, [uid, monthKey]);

  const saveGoal = async (nextText: string) => {
    if (!uid) return;
    await setDoc(
      doc(db, "users", uid, "monthGoals", monthKey),
      { text: nextText, updatedAt: serverTimestamp() },
      { merge: true }
    );
  };

  const deleteGoal = async () => {
    if (!uid) return;
    await deleteDoc(doc(db, "users", uid, "monthGoals", monthKey));
  };

  return uid
    ? { text, loading, error, saveGoal, deleteGoal }
    : { text: "", loading: false, error: null, saveGoal: async () => {}, deleteGoal: async () => {} };
}
