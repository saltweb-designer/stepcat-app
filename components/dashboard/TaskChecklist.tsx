"use client";

import { useState } from "react";
import { CalendarClock, Check, ChevronDown, ListChecks, Plus } from "lucide-react";
import { addDoc, arrayRemove, arrayUnion, collection, doc, serverTimestamp, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";
import { useTaskPresets } from "@/hooks/useTaskPresets";
import EntryActions from "@/components/entry-form/EntryActions";
import EntryFormModal from "@/components/entry-form/EntryFormModal";
import SelfPresetEditor from "@/components/action-log/SelfPresetEditor";
import ActionItemSheet from "@/components/action-log/ActionItemSheet";
import { ItemInput, isTouchDevice } from "@/components/action-log/ActionLogSection";
import type { EntryDoc } from "@/lib/types";

const PLACEHOLDER = "例：洗濯、買い出し";

/**
 * 日付カードのタスク欄。行動の起点（自分起点）と同じ形にそろえ、
 * 見出しの行に「よく使う項目」「追加」を並べ、タスクの一覧はアコーディオンで開閉する
 */
export default function TaskChecklist({ tasks, date }: { tasks: EntryDoc[]; date: string }) {
  const { user } = useAuth();
  const { presets, savePresets } = useTaskPresets(user?.uid);
  /** 初期状態では件数だけ見せて中身は畳んでおく */
  const [open, setOpen] = useState(false);
  /** null: 入力していない / inline: その場で入力(PC) / sheet: 入力カード(スマホ。その場の入力欄だとキーボードに隠れやすいため) */
  const [adding, setAdding] = useState<"inline" | "sheet" | null>(null);
  /** 追加後に入力欄を空にして続けて入力できるよう、key を変えて再マウントする */
  const [addInputKey, setAddInputKey] = useState(0);
  const [editingPresets, setEditingPresets] = useState(false);
  /** 時間や繰り返しを指定したいときは、これまでの入力画面を開く */
  const [detailedAdding, setDetailedAdding] = useState(false);

  const doneCount = tasks.filter((task) => task.completedDates.includes(date)).length;
  const addedTitles = tasks.map((task) => task.title.trim());

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

  /** その日だけ・終日のタスクとして追加する */
  const addTask = async (title: string) => {
    if (!user) return;
    await addDoc(collection(db, "users", user.uid, "entries"), {
      category: "task",
      title,
      autoTitle: true,
      detail: title,
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
  };

  const openDetailed = () => {
    setAdding(null);
    setDetailedAdding(true);
  };

  const detailedLink = (
    <button
      type="button"
      onClick={openDetailed}
      className="flex items-center gap-1 self-start rounded-full px-1.5 py-0.5 text-[11px] font-medium text-gray-400 transition-colors hover:bg-white hover:text-gray-700"
    >
      <CalendarClock className="h-3 w-3" strokeWidth={2} />
      時間・繰り返しを指定して追加
    </button>
  );

  return (
    <div className="mb-3 rounded-xl bg-gray-100 px-3 py-2">
      <div className="flex items-center justify-between gap-1">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="flex min-w-0 flex-1 items-center gap-1.5 whitespace-nowrap text-left text-xs font-bold text-gray-800"
        >
          <span className="h-2 w-2 shrink-0 rounded-full bg-gray-800" />
          タスク
          {tasks.length > 0 && (
            <span className="font-semibold opacity-70">
              {doneCount}/{tasks.length}
            </span>
          )}
          <ChevronDown
            className={`h-3.5 w-3.5 shrink-0 opacity-60 transition-transform ${open ? "rotate-180" : ""}`}
            strokeWidth={2.5}
          />
        </button>
        <div className="flex shrink-0 items-center gap-0.5">
          {!editingPresets && (
            <button
              type="button"
              onClick={() => setEditingPresets(true)}
              className="flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[11px] font-semibold text-gray-800 transition-colors hover:bg-white/70"
            >
              <ListChecks className="h-3 w-3" strokeWidth={2.5} />
              よく使う項目
            </button>
          )}
          {!adding && (
            <button
              type="button"
              onClick={() => setAdding(isTouchDevice() ? "sheet" : "inline")}
              aria-label="追加"
              className="flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[11px] font-semibold text-gray-800 transition-colors hover:bg-white/70"
            >
              <Plus className="h-3 w-3" strokeWidth={2.5} />
              追加
            </button>
          )}
        </div>
      </div>

      {editingPresets && (
        <SelfPresetEditor
          initialItems={presets}
          onSave={savePresets}
          onClose={() => setEditingPresets(false)}
          description="追加するときにタップで選べる、よく使うタスクです。"
          placeholder="例：洗濯"
        />
      )}

      {open && tasks.length > 0 && (
        <ul className="mt-1.5 flex flex-col gap-1">
          {tasks.map((task) => {
            const isDone = task.completedDates.includes(date);
            return (
              <li key={task.id} className="flex items-center gap-1 rounded-lg bg-white/80 py-0.5 pl-1 pr-0.5">
                <button
                  type="button"
                  onClick={() => toggle(task)}
                  className="flex min-w-0 flex-1 items-center gap-2.5 rounded-lg px-1.5 py-1 text-left"
                >
                  <span
                    className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 transition-colors ${
                      isDone ? "border-black bg-black" : "border-gray-300 bg-white"
                    }`}
                  >
                    {isDone && <Check className="h-3.5 w-3.5 text-white" strokeWidth={3} />}
                  </span>
                  <span
                    className={`min-w-0 break-words text-sm ${isDone ? "text-gray-400 line-through" : "text-gray-700"}`}
                  >
                    {task.title}
                  </span>
                </button>
                <EntryActions entry={task} date={date} />
              </li>
            );
          })}
        </ul>
      )}

      {adding === "inline" && (
        <div className="mt-1.5 flex flex-col gap-1">
          <ItemInput
            key={addInputKey}
            initialText=""
            placeholder={PLACEHOLDER}
            presets={presets}
            addedTexts={addedTitles}
            onSubmit={async (text) => {
              await addTask(text);
              setAddInputKey((k) => k + 1);
            }}
            onCancel={() => setAdding(null)}
          />
          {detailedLink}
        </div>
      )}

      {adding === "sheet" && (
        <ActionItemSheet title="タスクを追加" dotClass="bg-gray-800" textClass="text-gray-800" onClose={() => setAdding(null)}>
          <div className="flex flex-col gap-1">
            <ItemInput
              initialText=""
              placeholder={PLACEHOLDER}
              keepVisible={false}
              presets={presets}
              addedTexts={addedTitles}
              onSubmit={async (text) => {
                // 入力カードは1件保存したら閉じる。続けて追加するときは「追加」ボタンから開き直す
                await addTask(text);
                setAdding(null);
              }}
              onCancel={() => setAdding(null)}
            />
            {detailedLink}
          </div>
        </ActionItemSheet>
      )}

      {detailedAdding && (
        <EntryFormModal initialDate={date} initialCategory="task" onClose={() => setDetailedAdding(false)} />
      )}
    </div>
  );
}
