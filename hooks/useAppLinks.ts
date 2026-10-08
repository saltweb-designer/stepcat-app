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
import type { AppLinkDoc } from "@/lib/types";

export type AppLinkInput = Pick<AppLinkDoc, "name" | "href" | "iconUrl">;

export function useAppLinks(uid: string | undefined) {
  const [appLinks, setAppLinks] = useState<AppLinkDoc[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!uid) return;

    const q = query(collection(db, "users", uid, "appLinks"), orderBy("order", "asc"));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        setAppLinks(
          snapshot.docs.map((docSnap) => {
            const data = docSnap.data();
            return {
              id: docSnap.id,
              name: data.name ?? "",
              href: data.href ?? "",
              iconUrl: data.iconUrl ?? "",
              order: typeof data.order === "number" ? data.order : 0,
            } satisfies AppLinkDoc;
          })
        );
        setError(null);
      },
      (err) => {
        console.error("関連アプリの取得に失敗しました", err);
        setError(
          err.code === "permission-denied"
            ? "アクセス権限がありません。Firestoreのセキュリティルールをご確認ください。"
            : "関連アプリの取得に失敗しました。"
        );
      }
    );

    return unsubscribe;
  }, [uid]);

  const addAppLink = async (input: AppLinkInput) => {
    if (!uid) return;
    const nextOrder = appLinks.reduce((max, a) => Math.max(max, a.order), -1) + 1;
    await addDoc(collection(db, "users", uid, "appLinks"), {
      ...input,
      order: nextOrder,
      createdAt: serverTimestamp(),
    });
  };

  const updateAppLink = async (id: string, input: AppLinkInput) => {
    if (!uid) return;
    await updateDoc(doc(db, "users", uid, "appLinks", id), { ...input });
  };

  const deleteAppLink = async (id: string) => {
    if (!uid) return;
    await deleteDoc(doc(db, "users", uid, "appLinks", id));
  };

  return uid
    ? { appLinks, error, addAppLink, updateAppLink, deleteAppLink }
    : {
        appLinks: [],
        error: null,
        addAppLink: async () => {},
        updateAppLink: async () => {},
        deleteAppLink: async () => {},
      };
}
