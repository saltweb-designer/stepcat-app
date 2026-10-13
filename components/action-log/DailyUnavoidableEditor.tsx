"use client";

import { useState } from "react";

/** 「毎日の不可避」を1行1項目で編集する */
export default function DailyUnavoidableEditor({
  initialItems,
  onSave,
  onClose,
}: {
  initialItems: string[];
  onSave: (items: string[]) => Promise<void>;
  onClose: () => void;
}) {
  const [text, setText] = useState(initialItems.join("\n"));
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      const items = text
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean);
      await onSave(items);
      onClose();
    } catch (err) {
      console.error("毎日の不可避の保存に失敗しました", err);
      setSaving(false);
    }
  };

  return (
    <div className="mt-1.5 flex flex-col gap-1.5 rounded-lg bg-white/80 p-2.5">
      <p className="text-[11px] text-gray-500">
        毎日自動で入る不可避の項目です（1行に1項目）。その日だけ変えたいときは、日ごとのリストで編集してください。
      </p>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={4}
        autoFocus
        placeholder={"睡眠\n通勤\n洗濯などの家事"}
        className="w-full resize-none rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-base text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-black/10 sm:text-sm"
      />
      <div className="flex justify-end gap-1.5">
        <button
          type="button"
          onClick={onClose}
          className="rounded-full px-3 py-1.5 text-xs font-medium text-gray-500 transition-colors hover:bg-gray-100"
        >
          キャンセル
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="rounded-full bg-gray-900 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {saving ? "保存中" : "保存"}
        </button>
      </div>
    </div>
  );
}
