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
  writeBatch,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { NoteCategoryDoc } from "@/lib/types";

/** カテゴリ一覧の購読と編集。ノート（noteCategories）・動画（videoCategories）・音楽（musicCategories）・トレーニング動画（trainingVideoCategories）で共通のコレクション形式を使う */
export function useNoteCategories(
  uid: string | undefined,
  collectionName: "noteCategories" | "videoCategories" | "musicCategories" | "trainingVideoCategories" = "noteCategories"
) {
  const [categories, setCategories] = useState<NoteCategoryDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!uid) return;

    const q = query(collection(db, "users", uid, collectionName), orderBy("order", "asc"));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        setCategories(
          snapshot.docs.map((docSnap) => {
            const data = docSnap.data();
            return {
              id: docSnap.id,
              name: data.name ?? "",
              order: typeof data.order === "number" ? data.order : 0,
            } satisfies NoteCategoryDoc;
          })
        );
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.error("カテゴリの取得に失敗しました", err);
        setError(
          err.code === "permission-denied"
            ? "アクセス権限がありません。Firestoreのセキュリティルールをご確認ください。"
            : "カテゴリの取得に失敗しました。"
        );
        setLoading(false);
      }
    );

    return unsubscribe;
  }, [uid, collectionName]);

  const addCategory = async (name: string) => {
    if (!uid) return;
    const trimmed = name.trim();
    if (!trimmed) return;
    const nextOrder = categories.reduce((max, c) => Math.max(max, c.order), -1) + 1;
    await addDoc(collection(db, "users", uid, collectionName), {
      name: trimmed,
      order: nextOrder,
      createdAt: serverTimestamp(),
    });
  };

  const renameCategory = async (id: string, name: string) => {
    if (!uid) return;
    const trimmed = name.trim();
    if (!trimmed) return;
    await updateDoc(doc(db, "users", uid, collectionName, id), { name: trimmed });
  };

  const deleteCategory = async (id: string) => {
    if (!uid) return;
    await deleteDoc(doc(db, "users", uid, collectionName, id));
  };

  /** 並べ替え後の id の順番どおりに order を振り直す */
  const reorderCategories = async (orderedIds: string[]) => {
    if (!uid) return;
    const batch = writeBatch(db);
    orderedIds.forEach((id, i) => batch.update(doc(db, "users", uid, collectionName, id), { order: i }));
    await batch.commit();
  };

  return uid
    ? { categories, loading, error, addCategory, renameCategory, deleteCategory, reorderCategories }
    : {
        categories: [],
        loading: false,
        error: null,
        addCategory: async () => {},
        renameCategory: async () => {},
        deleteCategory: async () => {},
        reorderCategories: async () => {},
      };
}
