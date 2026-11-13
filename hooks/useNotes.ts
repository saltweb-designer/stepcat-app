"use client";

import { useEffect, useState } from "react";
import {
  addDoc,
  collection,
  doc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
  writeBatch,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { NoteDoc } from "@/lib/types";

export function useNotes(uid: string | undefined) {
  const [notes, setNotes] = useState<NoteDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!uid) return;

    const q = query(collection(db, "users", uid, "notes"), orderBy("updatedAt", "desc"));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        setNotes(
          snapshot.docs.map((docSnap) => {
            const data = docSnap.data();
            return {
              id: docSnap.id,
              categoryId: data.categoryId ?? "",
              text: data.text ?? "",
              pinned: data.pinned ?? false,
            } satisfies NoteDoc;
          })
        );
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.error("ノートの取得に失敗しました", err);
        setError(
          err.code === "permission-denied"
            ? "アクセス権限がありません。Firestoreのセキュリティルールをご確認ください。"
            : "ノートの取得に失敗しました。"
        );
        setLoading(false);
      }
    );

    return unsubscribe;
  }, [uid]);

  /** 作成したノートの ID を返す（続けて画像を紐づけるため） */
  const addNote = async (categoryId: string, text: string): Promise<string | undefined> => {
    if (!uid) return;
    const ref = await addDoc(collection(db, "users", uid, "notes"), {
      categoryId,
      text,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return ref.id;
  };

  const updateNote = async (id: string, categoryId: string, text: string) => {
    if (!uid) return;
    await updateDoc(doc(db, "users", uid, "notes", id), {
      categoryId,
      text,
      updatedAt: serverTimestamp(),
    });
  };

  const duplicateNote = async (note: NoteDoc) => {
    if (!uid) return;
    await addDoc(collection(db, "users", uid, "notes"), {
      categoryId: note.categoryId,
      text: note.text,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  };

  /** チェックリストのチェック切り替え用。updatedAt を変えず、チェックするたびに並び順が動かないようにする */
  const setNoteText = async (id: string, text: string) => {
    if (!uid) return;
    await updateDoc(doc(db, "users", uid, "notes", id), { text });
  };

  /** ピン留めの切り替えでは updatedAt を変えず、一覧の並び順（更新順）を崩さない */
  const setNotePinned = async (id: string, pinned: boolean) => {
    if (!uid) return;
    await updateDoc(doc(db, "users", uid, "notes", id), { pinned });
  };

  /** ノートに紐づく画像（noteImages）もまとめて削除する */
  const deleteNote = async (id: string) => {
    if (!uid) return;
    const images = await getDocs(
      query(collection(db, "users", uid, "noteImages"), where("noteId", "==", id))
    );
    const batch = writeBatch(db);
    images.forEach((imageDoc) => batch.delete(imageDoc.ref));
    batch.delete(doc(db, "users", uid, "notes", id));
    await batch.commit();
  };

  return uid
    ? { notes, loading, error, addNote, updateNote, setNoteText, duplicateNote, setNotePinned, deleteNote }
    : {
        notes: [],
        loading: false,
        error: null,
        addNote: async () => undefined,
        updateNote: async () => {},
        setNoteText: async () => {},
        duplicateNote: async () => {},
        setNotePinned: async () => {},
        deleteNote: async () => {},
      };
}
