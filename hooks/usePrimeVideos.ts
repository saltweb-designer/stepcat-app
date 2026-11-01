"use client";

import { useEffect, useState } from "react";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { PrimeVideoDoc, PrimeVideoInput } from "@/lib/types";

/** アマプラページの作品リンク。users/{uid}/primeVideos に保存し、画像も同じドキュメントに入れる */
export function usePrimeVideos(uid: string | undefined) {
  const [items, setItems] = useState<PrimeVideoDoc[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!uid) return;

    const q = query(collection(db, "users", uid, "primeVideos"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        setItems(
          snapshot.docs.map((docSnap) => {
            const data = docSnap.data();
            return {
              id: docSnap.id,
              url: data.url ?? "",
              title: data.title ?? "",
              imageDataUrl: data.imageDataUrl ?? "",
              categoryId: data.categoryId ?? "",
              memo: data.memo ?? "",
              pinned: data.pinned ?? false,
            } satisfies PrimeVideoDoc;
          })
        );
        setError(null);
      },
      (err) => {
        console.error("アマプラの取得に失敗しました", err);
        setError(
          err.code === "permission-denied"
            ? "アクセス権限がありません。Firestoreのセキュリティルールをご確認ください。"
            : "アマプラの取得に失敗しました。"
        );
      }
    );

    return unsubscribe;
  }, [uid]);

  const addItem = async (input: PrimeVideoInput) => {
    if (!uid) return;
    await addDoc(collection(db, "users", uid, "primeVideos"), {
      ...input,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  };

  const updateItem = async (id: string, input: PrimeVideoInput) => {
    if (!uid) return;
    await updateDoc(doc(db, "users", uid, "primeVideos", id), {
      ...input,
      updatedAt: serverTimestamp(),
    });
  };

  const setItemPinned = async (id: string, pinned: boolean) => {
    if (!uid) return;
    await updateDoc(doc(db, "users", uid, "primeVideos", id), { pinned });
  };

  const deleteItem = async (id: string) => {
    if (!uid) return;
    await deleteDoc(doc(db, "users", uid, "primeVideos", id));
  };

  return uid
    ? { items, error, addItem, updateItem, setItemPinned, deleteItem }
    : {
        items: [],
        error: null,
        addItem: async () => {},
        updateItem: async () => {},
        setItemPinned: async () => {},
        deleteItem: async () => {},
      };
}
