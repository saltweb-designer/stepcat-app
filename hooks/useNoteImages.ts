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
import type { NoteImageDoc } from "@/lib/types";

/** 画像を圧縮してノートに紐づけて保存する。新規ノート作成直後にも使う */
export async function addNoteImages(uid: string, noteId: string, files: File[]) {
  for (const file of files) {
    const dataUrl = await compressImageToDataUrl(file);
    await addDoc(collection(db, "users", uid, "noteImages"), {
      noteId,
      dataUrl,
      createdAt: serverTimestamp(),
    });
  }
}

export function useNoteImages(uid: string | undefined, noteId: string) {
  const [images, setImages] = useState<NoteImageDoc[]>([]);

  useEffect(() => {
    if (!uid) return;

    const q = query(collection(db, "users", uid, "noteImages"), where("noteId", "==", noteId));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const next = snapshot.docs.map((d) => {
          const raw = d.data();
          const createdAt = raw.createdAt as Timestamp | null;
          return {
            id: d.id,
            noteId: raw.noteId as string,
            dataUrl: raw.dataUrl as string,
            // 保存直後はサーバー時刻が未確定なので、最後尾に並ぶよう現在時刻で扱う
            createdAtMs: createdAt ? createdAt.toMillis() : Date.now(),
          };
        });
        next.sort((a, b) => a.createdAtMs - b.createdAtMs);
        setImages(next);
      },
      (err) => console.error("ノート画像の取得に失敗しました", err)
    );

    return unsubscribe;
  }, [uid, noteId]);

  const addImages = async (files: File[]) => {
    if (!uid) return;
    await addNoteImages(uid, noteId, files);
  };

  const deleteImage = async (id: string) => {
    if (!uid) return;
    await deleteDoc(doc(db, "users", uid, "noteImages", id));
  };

  return { images: uid ? images : [], addImages, deleteImage };
}
