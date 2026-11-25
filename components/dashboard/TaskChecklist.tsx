"use client";

import { useState } from "react";
import { Check, ListChecks, Plus } from "lucide-react";
import { addDoc, arrayRemove, arrayUnion, collection, doc, serverTimestamp, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";
import { useTaskPresets } from "@/hooks/useTaskPresets";
import EntryActions from "@/components/entry-form/EntryActions";
import EntryFormModal from "@/components/entry-form/EntryFormModal";
import SelfPresetEditor from "@/components/action-log/SelfPresetEditor";
import type { EntryDoc } from "@/lib/types";

export default function TaskChecklist({ tasks, date }: { tasks: EntryDoc[]; date: string }) {
  const { user } = useAuth();
  const { presets, savePresets } = useTaskPresets(user?.uid);
  const [adding, setAdding] = useState(false);
  const [editingPresets, setEditingPresets] = useState(false);
  /** 連打で同じタスクが二重にできないよう、保存中の項目を覚えておく */
  const [savingPreset, setSavingPreset] = useState<string | null>(null);

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

  /** よく使う項目をタップしたら、入力画面を開かずにその日だけ・終日のタスクとして追加する */
  const addPreset = async (preset: string) => {
    if (!user || savingPreset) return;
    setSavingPreset(preset);
    try {
      await addDoc(collection(db, "users", user.uid, "entries"), {
        category: "task",
        title: preset,
        autoTitle: true,
        detail: preset,
        link: "",
        startDate: date,
        endDate: date,
        allDay: true,
        startTime: "",
        endTime: "",
        weekdays: [],
        completedDates: [],
        excludedDates: [],
        createdAt: serverTimestamp(),
      });
    } catch (error) {
      console.error("タスクの追加に失敗しました", error);
    } finally {
      setSavingPreset(null);
    }
  };

  const addedTitles = new Set(tasks.map((task) => task.title.trim()));

  return (
    <div className="flex min-w-0 flex-1 flex-col gap-1.5">
      <div className="flex items-start gap-2">
        {/* メモ欄と同じく、空ならタップ1回でタスクの入力画面を開けるようにする */}
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

        {!editingPresets && (
          <button
            type="button"
            onClick={() => setEditingPresets(true)}
            className="flex shrink-0 items-center gap-0.5 rounded-full px-2 py-0.5 text-[11px] font-semibold text-gray-500 transition-colors hover:bg-white hover:text-gray-800"
          >
            <ListChecks className="h-3 w-3" strokeWidth={2.5} />
            よく使う項目
          </button>
        )}
      </div>

      {/* よく使う項目はタップ1回でその日のタスクに追加する。追加済みはチェックを付けて押せないようにする */}
      {presets.length > 0 && !editingPresets && (
        <div className="flex flex-wrap gap-1">
          {presets.map((preset) => {
            const added = addedTitles.has(preset);
            return (
              <button
                key={preset}
                type="button"
                disabled={added || savingPreset !== null}
                onClick={() => addPreset(preset)}
                className={`flex items-center gap-0.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors ${
                  added
                    ? "cursor-default border-gray-300 bg-gray-200/70 text-gray-500"
                    : "border-gray-200 bg-white text-gray-700 hover:bg-gray-100 disabled:opacity-40"
                }`}
              >
                {added ? <Check className="h-3 w-3" strokeWidth={2.5} /> : <Plus className="h-3 w-3" strokeWidth={2.5} />}
                {preset}
              </button>
            );
          })}
        </div>
      )}

      {editingPresets && (
        <SelfPresetEditor
          initialItems={presets}
          onSave={savePresets}
          onClose={() => setEditingPresets(false)}
          description="タップ1回でその日のタスクに追加できる、よく使うタスクです。"
          placeholder="例：洗濯"
        />
      )}

      {adding && (
        <EntryFormModal initialDate={date} initialCategory="task" onClose={() => setAdding(false)} />
      )}
    </div>
  );
}
