"use client";

import { Check } from "lucide-react";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";
import type { Task } from "@/lib/types";

export default function TaskChecklist({ tasks }: { tasks: Task[] }) {
  const { user } = useAuth();

  const toggle = async (task: Task) => {
    if (!user) return;
    try {
      await updateDoc(doc(db, "users", user.uid, "entries", task.id), {
        done: !task.done,
      });
    } catch (error) {
      console.error("タスクの更新に失敗しました", error);
    }
  };

  if (tasks.length === 0) {
    return <p className="text-sm text-gray-400">タスクはありません</p>;
  }

  return (
    <ul className="flex flex-col gap-1.5">
      {tasks.map((task) => (
        <li key={task.id}>
          <button
            type="button"
            onClick={() => toggle(task)}
            className="flex w-full items-center gap-2.5 rounded-lg px-1.5 py-1 text-left transition-colors hover:bg-gray-50"
          >
            <span
              className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 transition-colors ${
                task.done ? "border-black bg-black" : "border-gray-300 bg-white"
              }`}
            >
              {task.done && <Check className="h-3.5 w-3.5 text-white" strokeWidth={3} />}
            </span>
            <span className={`text-sm ${task.done ? "text-gray-400 line-through" : "text-gray-700"}`}>
              {task.title}
            </span>
          </button>
        </li>
      ))}
    </ul>
  );
}
