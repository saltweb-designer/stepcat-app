import { arrayRemove, arrayUnion, collection, doc, serverTimestamp, writeBatch } from "firebase/firestore";
import { db } from "./firebase";
import { addDays, listOccurrences, type EditScope } from "./recurrence";
import type { EntryDoc } from "./types";

/** フォームから保存する項目（完了状態・除外日はシリーズ側で管理するため含めない） */
export type EntryPayload = Omit<EntryDoc, "id" | "completedDates" | "excludedDates">;

function hasRemainingOccurrences(entry: EntryDoc, overrides: Partial<EntryDoc>): boolean {
  return listOccurrences({ ...entry, ...overrides }).length > 0;
}

/**
 * 既存エントリの編集を、指定した範囲（この日のみ / この日以降 / すべて）に反映する。
 * - single:    元のシリーズからその日を除外し、編集内容を単日の別エントリとして登録する
 * - following: 元のシリーズを前日で打ち切り、その日以降を編集内容の新しいエントリとして登録する
 * - all:       元のエントリをそのまま更新する
 */
export async function updateEntryWithScope(
  uid: string,
  entry: EntryDoc,
  payload: EntryPayload,
  scope: EditScope,
  date: string
) {
  const entriesRef = collection(db, "users", uid, "entries");
  const entryRef = doc(entriesRef, entry.id);
  const batch = writeBatch(db);

  if (scope === "all" || (scope === "following" && date <= entry.startDate)) {
    batch.update(entryRef, payload);
  } else if (scope === "single") {
    const excludedDates = [...entry.excludedDates, date];
    if (hasRemainingOccurrences(entry, { excludedDates })) {
      batch.update(entryRef, { excludedDates: arrayUnion(date), completedDates: arrayRemove(date) });
    } else {
      batch.delete(entryRef);
    }
    batch.set(doc(entriesRef), {
      ...payload,
      completedDates: entry.completedDates.includes(date) ? [date] : [],
      excludedDates: [],
      createdAt: serverTimestamp(),
    });
  } else {
    const previousEnd = addDays(date, -1);
    const earlier = {
      endDate: previousEnd,
      completedDates: entry.completedDates.filter((d) => d < date),
      excludedDates: entry.excludedDates.filter((d) => d < date),
    };
    if (hasRemainingOccurrences(entry, earlier)) {
      batch.update(entryRef, earlier);
    } else {
      batch.delete(entryRef);
    }
    batch.set(doc(entriesRef), {
      ...payload,
      completedDates: entry.completedDates.filter((d) => d >= date),
      excludedDates: entry.excludedDates.filter((d) => d >= date),
      createdAt: serverTimestamp(),
    });
  }

  await batch.commit();
}

/** 既存エントリの削除を、指定した範囲（この日のみ / この日以降 / すべて）に反映する */
export async function deleteEntryWithScope(uid: string, entry: EntryDoc, scope: EditScope, date?: string) {
  const entryRef = doc(db, "users", uid, "entries", entry.id);
  const batch = writeBatch(db);

  if (scope === "all" || !date || (scope === "following" && date <= entry.startDate)) {
    batch.delete(entryRef);
  } else if (scope === "single") {
    const excludedDates = [...entry.excludedDates, date];
    if (hasRemainingOccurrences(entry, { excludedDates })) {
      batch.update(entryRef, { excludedDates: arrayUnion(date), completedDates: arrayRemove(date) });
    } else {
      batch.delete(entryRef);
    }
  } else {
    const earlier = {
      endDate: addDays(date, -1),
      completedDates: entry.completedDates.filter((d) => d < date),
      excludedDates: entry.excludedDates.filter((d) => d < date),
    };
    if (hasRemainingOccurrences(entry, earlier)) {
      batch.update(entryRef, earlier);
    } else {
      batch.delete(entryRef);
    }
  }

  await batch.commit();
}
