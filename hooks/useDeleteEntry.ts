"use client";

import { doc, deleteDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";

export function useDeleteEntry() {
  const { user } = useAuth();

  return async (id: string) => {
    if (!user) return;
    const confirmed = window.confirm("この予定を削除してもよろしいですか？");
    if (!confirmed) return;

    try {
      await deleteDoc(doc(db, "users", user.uid, "entries", id));
    } catch (error) {
      console.error("削除に失敗しました", error);
    }
  };
}
