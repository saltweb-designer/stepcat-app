"use client";

import { useEffect, useState } from "react";
import { doc, onSnapshot, serverTimestamp, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

/** タスクの「よく使う項目」を購読する。未設定なら空 */
export function useTaskPresets(uid: string | undefined) {
  const [presets, setPresets] = useState<string[]>([]);

  useEffect(() => {
    if (!uid) return;
    const unsubscribe = onSnapshot(
      doc(db, "users", uid, "settings", "tasks"),
      (snapshot) => {
        const raw = snapshot.data()?.presets;
        setPresets(Array.isArray(raw) ? raw.filter((item): item is string => typeof item === "string") : []);
      },
      (err) => console.error("よく使うタスクの取得に失敗しました", err)
    );
    return unsubscribe;
  }, [uid]);

  const savePresets = async (items: string[]) => {
    if (!uid) return;
    await setDoc(
      doc(db, "users", uid, "settings", "tasks"),
      { presets: items, updatedAt: serverTimestamp() },
      { merge: true }
    );
  };

  return { presets: uid ? presets : [], savePresets };
}
