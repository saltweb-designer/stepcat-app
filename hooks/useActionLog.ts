"use client";

import { useEffect, useState } from "react";
import { arrayRemove, arrayUnion, doc, onSnapshot, serverTimestamp, setDoc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { normalizeActionLogDoc } from "@/lib/action-log";
import type { ActionItem, ActionLogDoc, ActionOrigin } from "@/lib/types";

/** 指定日の「自分起点・他人起点・不可避」リストを購読する */
export function useActionLog(uid: string | undefined, date: string) {
  const [data, setData] = useState<ActionLogDoc | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!uid) return;

    const ref = doc(db, "users", uid, "actionLogs", date);
    const unsubscribe = onSnapshot(
      ref,
      (snapshot) => {
        setData(snapshot.exists() ? normalizeActionLogDoc(date, snapshot.data()) : null);
        setError(null);
      },
      (err) => {
        console.error("行動記録の取得に失敗しました", err);
        setError(
          err.code === "permission-denied"
            ? "アクセス権限がありません。Firestoreのセキュリティルールをご確認ください。"
            : "行動記録の取得に失敗しました。"
        );
      }
    );

    return unsubscribe;
  }, [uid, date]);

  const addItem = async (origin: ActionOrigin, text: string) => {
    if (!uid) return;
    const item: ActionItem = { id: crypto.randomUUID(), text };
    await setDoc(
      doc(db, "users", uid, "actionLogs", date),
      { date, [origin]: arrayUnion(item), updatedAt: serverTimestamp() },
      { merge: true }
    );
  };

  const updateItem = async (origin: ActionOrigin, id: string, text: string) => {
    if (!uid || !data) return;
    const next = data[origin].map((item) => (item.id === id ? { ...item, text } : item));
    await updateDoc(doc(db, "users", uid, "actionLogs", date), { [origin]: next, updatedAt: serverTimestamp() });
  };

  const removeItem = async (origin: ActionOrigin, item: ActionItem) => {
    if (!uid) return;
    await updateDoc(doc(db, "users", uid, "actionLogs", date), {
      [origin]: arrayRemove(item),
      updatedAt: serverTimestamp(),
    });
  };

  return uid
    ? { data, error, addItem, updateItem, removeItem }
    : { data: null, error: null, addItem: async () => {}, updateItem: async () => {}, removeItem: async () => {} };
}
