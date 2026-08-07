"use client";

import { useEffect, useState } from "react";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { EntryDoc } from "@/lib/types";
import { enumerateDateRange } from "@/lib/week";

export function useEntries(uid: string | undefined) {
  const [entries, setEntries] = useState<EntryDoc[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!uid) return;

    const q = query(collection(db, "users", uid, "entries"), orderBy("startDate", "asc"));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        setEntries(
          snapshot.docs.map((doc) => {
            const data = doc.data();
            const startDate = data.startDate;
            const endDate = data.endDate ?? data.startDate;
            // 旧形式（done: boolean のみ）からの移行: 完了済みだった場合は期間内の全日を完了扱いにする
            const completedDates: string[] = Array.isArray(data.completedDates)
              ? data.completedDates
              : data.done
                ? enumerateDateRange(startDate, endDate)
                : [];
            return {
              id: doc.id,
              category: data.category,
              title: data.title ?? "",
              detail: data.detail ?? "",
              link: data.link ?? "",
              startDate,
              endDate,
              allDay: data.allDay ?? true,
              startTime: data.startTime ?? "",
              endTime: data.endTime ?? "",
              completedDates,
            } satisfies EntryDoc;
          })
        );
        setLoading(false);
      },
      (error) => {
        console.error("エントリの取得に失敗しました", error);
        setLoading(false);
      }
    );

    return unsubscribe;
  }, [uid]);

  return uid ? { entries, loading } : { entries: [], loading: false };
}
