"use client";

import { useEffect, useState } from "react";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { normalizeActionLogDoc } from "@/lib/action-log";
import type { ActionLogDoc } from "@/lib/types";

/** startDate〜endDate（両端含む, YYYY-MM-DD）の行動記録を購読する */
export function useActionLogRange(uid: string | undefined, startDate: string, endDate: string) {
  const [logs, setLogs] = useState<ActionLogDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!uid) return;

    const q = query(
      collection(db, "users", uid, "actionLogs"),
      where("date", ">=", startDate),
      where("date", "<=", endDate)
    );
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        setLogs(snapshot.docs.map((d) => normalizeActionLogDoc(d.id, d.data())));
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.error("行動記録の集計に失敗しました", err);
        setError(
          err.code === "permission-denied"
            ? "アクセス権限がありません。Firestoreのセキュリティルールをご確認ください。"
            : "行動記録の集計に失敗しました。"
        );
        setLoading(false);
      }
    );

    return unsubscribe;
  }, [uid, startDate, endDate]);

  return uid ? { logs, loading, error } : { logs: [], loading: false, error: null };
}
