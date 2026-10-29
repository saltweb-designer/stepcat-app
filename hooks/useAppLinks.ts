"use client";

import { useEffect, useState } from "react";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  updateDoc,
  writeBatch,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { appLinkKey, defaultAppLinks } from "@/lib/app-links";
import type { AppLinkDoc } from "@/lib/types";

export type AppLinkInput = Pick<AppLinkDoc, "name" | "href" | "iconUrl">;

/**
 * 初期の関連アプリ（動画・Yuru-English・Lumina-CPT）を一度だけ登録する。
 * settings/appLinks の seeded フラグで登録済みかを判定するため、削除したアプリが復活することはない
 */
async function seedDefaultAppLinks(uid: string) {
  const flagRef = doc(db, "users", uid, "settings", "appLinks");
  await runTransaction(db, async (tx) => {
    const flag = await tx.get(flagRef);
    if (flag.exists() && flag.data().seeded) return;
    defaultAppLinks.forEach(({ id, ...app }, i) => {
      // 既存のアプリより前に並ぶよう、負の order を割り当てる
      tx.set(doc(db, "users", uid, "appLinks", id), {
        ...app,
        order: i - defaultAppLinks.length,
        createdAt: serverTimestamp(),
      });
    });
    tx.set(flagRef, { seeded: true }, { merge: true });
  });
}

/**
 * 初期の関連アプリと同じURLで以前に手動登録していたアプリを一度だけ削除し、重複を解消する。
 * settings/appLinks の dedupedDefaults フラグで実行済みかを判定する
 */
async function removeDuplicatesOfDefaults(uid: string) {
  const flagRef = doc(db, "users", uid, "settings", "appLinks");
  const snapshot = await getDocs(collection(db, "users", uid, "appLinks"));
  const defaultIds = new Set(defaultAppLinks.map((app) => app.id));
  const defaultKeys = new Set(defaultAppLinks.map((app) => appLinkKey(app.href)));
  const duplicates = snapshot.docs.filter(
    (d) => !defaultIds.has(d.id) && defaultKeys.has(appLinkKey(String(d.data().href ?? "")))
  );
  await runTransaction(db, async (tx) => {
    const flag = await tx.get(flagRef);
    if (flag.exists() && flag.data().dedupedDefaults) return;
    duplicates.forEach((d) => tx.delete(d.ref));
    tx.set(flagRef, { dedupedDefaults: true }, { merge: true });
  });
}

export function useAppLinks(uid: string | undefined) {
  const [appLinks, setAppLinks] = useState<AppLinkDoc[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!uid) return;

    seedDefaultAppLinks(uid)
      .then(() => removeDuplicatesOfDefaults(uid))
      .catch((err) => console.error("初期の関連アプリの登録に失敗しました", err));

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

  /** 並べ替え後の id の順番どおりに order を振り直す */
  const reorderAppLinks = async (orderedIds: string[]) => {
    if (!uid) return;
    const batch = writeBatch(db);
    orderedIds.forEach((id, i) => batch.update(doc(db, "users", uid, "appLinks", id), { order: i }));
    await batch.commit();
  };

  return uid
    ? { appLinks, error, addAppLink, updateAppLink, deleteAppLink, reorderAppLinks }
    : {
        appLinks: [],
        error: null,
        addAppLink: async () => {},
        updateAppLink: async () => {},
        deleteAppLink: async () => {},
        reorderAppLinks: async () => {},
      };
}
