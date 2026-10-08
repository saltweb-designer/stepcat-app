"use client";

import { useAuth } from "@/contexts/AuthContext";
import { deleteEntryWithScope } from "@/lib/entry-mutations";
import type { EditScope } from "@/lib/recurrence";
import type { EntryDoc } from "@/lib/types";

/** 削除の確認は呼び出し側（確認ダイアログ・範囲選択ダイアログ）で行う */
export function useDeleteEntry() {
  const { user } = useAuth();

  return async (entry: EntryDoc, scope: EditScope = "all", date?: string) => {
    if (!user) return;
    try {
      await deleteEntryWithScope(user.uid, entry, scope, date);
    } catch (error) {
      console.error("削除に失敗しました", error);
    }
  };
}
