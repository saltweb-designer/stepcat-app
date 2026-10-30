"use client";

import { useEffect, useState } from "react";
import { doc, onSnapshot, serverTimestamp, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { MediaCollection } from "@/hooks/useVideos";

/**
 * 動画・音楽・筋トレのページごとに、チャンネル（アカウント）の並び順を購読する。
 * settings/channelOrder-{コレクション名} の keys にチャンネルのキーを並び順どおりに保存する
 */
export function useChannelOrder(uid: string | undefined, collectionName: MediaCollection) {
  const [order, setOrder] = useState<string[]>([]);

  useEffect(() => {
    if (!uid) return;

    const ref = doc(db, "users", uid, "settings", `channelOrder-${collectionName}`);
    const unsubscribe = onSnapshot(
      ref,
      (snapshot) => {
        const keys = snapshot.exists() ? snapshot.data().keys : null;
        setOrder(Array.isArray(keys) ? keys.filter((key): key is string => typeof key === "string") : []);
      },
      (err) => console.error("チャンネルの並び順の取得に失敗しました", err)
    );

    return unsubscribe;
  }, [uid, collectionName]);

  const saveOrder = async (keys: string[]) => {
    if (!uid) return;
    await setDoc(
      doc(db, "users", uid, "settings", `channelOrder-${collectionName}`),
      { keys, updatedAt: serverTimestamp() },
      { merge: true }
    );
  };

  return { order: uid ? order : [], saveOrder };
}
