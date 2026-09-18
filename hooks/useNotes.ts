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

  const addNote = async (categoryId: string, text: string) => {
    if (!uid) return;
    await addDoc(collection(db, "users", uid, "notes"), {
      categoryId,
      text,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
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

  const deleteNote = async (id: string) => {
    if (!uid) return;
    await deleteDoc(doc(db, "users", uid, "notes", id));
  };

  return uid
    ? { notes, loading, error, addNote, updateNote, duplicateNote, deleteNote }
    : {
        notes: [],
        loading: false,
        error: null,
        addNote: async () => {},
        updateNote: async () => {},
        duplicateNote: async () => {},
        deleteNote: async () => {},
      };
}
