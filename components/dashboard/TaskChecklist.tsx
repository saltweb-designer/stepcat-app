"use client";

import { Check } from "lucide-react";
import { arrayRemove, arrayUnion, doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";
import EntryActions from "@/components/entry-form/EntryActions";
import type { EntryDoc } from "@/lib/types";

export default function TaskChecklist({ tasks, date }: { tasks: EntryDoc[]; date: string }) {
  const { user } = useAuth();

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

  if (tasks.length === 0) {
    return <p className="text-sm text-gray-400">タスクはありません</p>;
  }

  return (
    <ul className="flex flex-col gap-1">
      {tasks.map((task) => {
        const isDone = task.completedDates.includes(date);
        return (
          <li key={task.id} className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => toggle(task)}
              className="flex flex-1 items-center gap-2.5 rounded-lg px-1.5 py-1 text-left transition-colors hover:bg-gray-50"
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
            <EntryActions entry={task} />
          </li>
        );
      })}
    </ul>
  );
}
