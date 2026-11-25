"use client";

import { useState } from "react";
import { Check, Plus } from "lucide-react";
import { arrayRemove, arrayUnion, doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";
import EntryActions from "@/components/entry-form/EntryActions";
import EntryFormModal from "@/components/entry-form/EntryFormModal";
import type { EntryDoc } from "@/lib/types";

export default function TaskChecklist({ tasks, date }: { tasks: EntryDoc[]; date: string }) {
  const { user } = useAuth();
  const [adding, setAdding] = useState(false);

  const toggle = async (task: EntryDoc) => {
    if (!user) return;
    const isDone = task.completedDates.includes(date);
    try {
      await updateDoc(doc(db, "users", user.uid, "entries", task.id), {
        completedDates: isDone ? arrayRemove(date) : arrayUnion(date),
      });
    } catch (error) {
      console.error("タスクの更新に失敗しました", error);
    }
  };

  // メモ欄と同じく、空ならタップ1回でタスクの入力画面を開けるようにする
  return (
    <>
      {tasks.length === 0 ? (
        <button
          type="button"
          onClick={() => setAdding(true)}
          className="min-w-0 flex-1 text-left text-sm text-gray-400 transition-colors hover:text-gray-600"
        >
          まだタスクがありません
          <span className="ml-1.5 text-xs text-gray-300">タップして追加</span>
        </button>
      ) : (
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <ul className="flex flex-col gap-1">
            {tasks.map((task) => {
              const isDone = task.completedDates.includes(date);
              return (
                <li key={task.id} className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => toggle(task)}
                    className="flex flex-1 items-center gap-2.5 rounded-lg px-1.5 py-1 text-left transition-colors hover:bg-white"
                  >
                    <span
                      className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 transition-colors ${
                        isDone ? "border-black bg-black" : "border-gray-300 bg-white"
                      }`}
                    >
                      {isDone && <Check className="h-3.5 w-3.5 text-white" strokeWidth={3} />}
                    </span>
                    <span className={`text-sm ${isDone ? "text-gray-400 line-through" : "text-gray-700"}`}>
                      {task.title}
                    </span>
                  </button>
                  <EntryActions entry={task} date={date} />
                </li>
              );
            })}
          </ul>
          <button
            type="button"
            onClick={() => setAdding(true)}
            className="flex items-center gap-1 self-start rounded-full px-1.5 py-0.5 text-xs font-medium text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
          >
            <Plus className="h-3.5 w-3.5" strokeWidth={2.5} />
            タスクを追加
          </button>
        </div>
      )}

      {adding && (
        <EntryFormModal initialDate={date} initialCategory="task" onClose={() => setAdding(false)} />
      )}
    </>
  );
}
