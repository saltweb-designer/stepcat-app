"use client";

import { useEffect, useState } from "react";
import { arrayRemove, arrayUnion, doc, onSnapshot, serverTimestamp, setDoc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { normalizeActionLogDoc, resolveActionItems } from "@/lib/action-log";
import type { ActionItem, ActionLogDoc, ActionLogSettingsDoc, ActionOrigin } from "@/lib/types";

/** 指定日の「自分起点・他人起点・不可避」リストを購読する */
export function useActionLog(uid: string | undefined, date: string, settings: ActionLogSettingsDoc | null) {
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

  /** 「毎日の不可避」を使っている日は、その日の分として書き出してから変更する */
  const writeItems = async (origin: ActionOrigin, items: ActionItem[]) => {
    if (!uid) return;
    await setDoc(
      doc(db, "users", uid, "actionLogs", date),
      { date, [origin]: items, updatedAt: serverTimestamp() },
      { merge: true }
    );
  };

  const currentItems = (origin: ActionOrigin) => resolveActionItems(data, origin, settings, date);

  const addItem = async (origin: ActionOrigin, text: string) => {
    if (!uid) return;
    const item: ActionItem = { id: crypto.randomUUID(), text };
    const { items, isDaily } = currentItems(origin);
    if (isDaily) {
      await writeItems(origin, [...items, item]);
      return;
    }
    await setDoc(
      doc(db, "users", uid, "actionLogs", date),
      { date, [origin]: arrayUnion(item), updatedAt: serverTimestamp() },
      { merge: true }
    );
  };

  const updateItem = async (origin: ActionOrigin, id: string, text: string) => {
    const { items } = currentItems(origin);
    await writeItems(
      origin,
      items.map((item) => (item.id === id ? { ...item, text } : item))
    );
  };

  const removeItem = async (origin: ActionOrigin, item: ActionItem) => {
    if (!uid) return;
    const { items, isDaily } = currentItems(origin);
    if (isDaily) {
      await writeItems(
        origin,
        items.filter((i) => i.id !== item.id)
      );
      return;
    }
    await updateDoc(doc(db, "users", uid, "actionLogs", date), {
      [origin]: arrayRemove(item),
      updatedAt: serverTimestamp(),
    });
  };

  return uid
    ? { data, error, addItem, updateItem, removeItem }
    : {
        data: null,
        error: null,
        addItem: async () => {},
        updateItem: async () => {},
        removeItem: async () => {},
      };
}
