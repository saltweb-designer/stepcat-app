"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";

/** 「よく使う自分起点」を1行ずつ追加・編集・削除する */
export default function SelfPresetEditor({
  initialItems,
  onSave,
  onClose,
}: {
  initialItems: string[];
  onSave: (items: string[]) => Promise<void>;
  onClose: () => void;
}) {
  /** 行を削除しても入力欄がずれないよう、行ごとに key を持たせる */
  const [rows, setRows] = useState(() => initialItems.map((text, index) => ({ key: index, text })));
  const [nextKey, setNextKey] = useState(initialItems.length);
  const [saving, setSaving] = useState(false);

  const addRow = () => {
    setRows((prev) => [...prev, { key: nextKey, text: "" }]);
    setNextKey((k) => k + 1);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const items = rows.map((row) => row.text.trim()).filter(Boolean);
      // 同じ名前は1つにまとめる
      await onSave([...new Set(items)]);
      onClose();
    } catch (err) {
      console.error("よく使う項目の保存に失敗しました", err);
      setSaving(false);
    }
  };

  return (
    <div className="mt-1.5 flex flex-col gap-1.5 rounded-lg bg-white/80 p-2.5">
      <p className="text-[11px] text-gray-500">追加するときにタップで選べる、よく使う自分起点の項目です。</p>
      {rows.length > 0 && (
        <ul className="flex flex-col gap-1">
          {rows.map((row) => (
            <li key={row.key} className="flex items-center gap-1">
              <input
                value={row.text}
                onChange={(e) =>
                  setRows((prev) => prev.map((r) => (r.key === row.key ? { ...r, text: e.target.value } : r)))
                }
                autoFocus={row.key >= initialItems.length}
                placeholder="例：読書"
                className="min-w-0 flex-1 rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-base text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-black/10 sm:text-sm"
              />
              <button
                type="button"
                onClick={() => setRows((prev) => prev.filter((r) => r.key !== row.key))}
                aria-label={`「${row.text}」を削除`}
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-gray-100 hover:text-rose-600"
              >
                <Trash2 className="h-3.5 w-3.5" strokeWidth={2} />
              </button>
            </li>
          ))}
        </ul>
      )}
      <button
        type="button"
        onClick={addRow}
        className="flex items-center justify-center gap-0.5 rounded-lg border border-dashed border-gray-300 py-1.5 text-xs font-semibold text-gray-500 transition-colors hover:bg-gray-50"
      >
        <Plus className="h-3 w-3" strokeWidth={2.5} />
        項目を追加
      </button>
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
