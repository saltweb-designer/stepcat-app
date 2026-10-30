"use client";

import { useEffect, useState } from "react";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  serverTimestamp,
  where,
  type Timestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { compressImageToDataUrl } from "@/lib/image-compress";
import type { DayPhotoDoc } from "@/lib/types";

export function useDayPhotos(uid: string | undefined, date: string) {
  const [photos, setPhotos] = useState<DayPhotoDoc[]>([]);

  useEffect(() => {
    if (!uid) return;

    const q = query(collection(db, "users", uid, "dayPhotos"), where("date", "==", date));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const next = snapshot.docs.map((d) => {
          const raw = d.data();
          const createdAt = raw.createdAt as Timestamp | null;
          return {
            id: d.id,
            date: raw.date as string,
            dataUrl: raw.dataUrl as string,
            // 保存直後はサーバー時刻が未確定なので、最後尾に並ぶよう現在時刻で扱う
            createdAtMs: createdAt ? createdAt.toMillis() : Date.now(),
          };
        });
        next.sort((a, b) => a.createdAtMs - b.createdAtMs);
        setPhotos(next);
      },
      (err) => console.error("画像の取得に失敗しました", err)
    );

    return unsubscribe;
  }, [uid, date]);

  const addPhotos = async (files: File[]) => {
    if (!uid) return;
    for (const file of files) {
      const dataUrl = await compressImageToDataUrl(file);
      await addDoc(collection(db, "users", uid, "dayPhotos"), {
        date,
        dataUrl,
        createdAt: serverTimestamp(),
      });
    }
  };

  const deletePhoto = async (id: string) => {
    if (!uid) return;
    await deleteDoc(doc(db, "users", uid, "dayPhotos", id));
  };

  return { photos: uid ? photos : [], addPhotos, deletePhoto };
}
