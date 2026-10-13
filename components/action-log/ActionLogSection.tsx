"use client";

import { useState, type FormEvent } from "react";
import { Pencil, Plus, Trash2, X } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useActionLog } from "@/hooks/useActionLog";
import { ACTION_ORIGINS } from "@/lib/action-log";
import type { ActionItem, ActionOrigin } from "@/lib/types";

type Editing = { origin: ActionOrigin; id: string | null } | null;

function ItemInput({
  initialText,
  placeholder,
  onSubmit,
  onCancel,
}: {
  initialText: string;
  placeholder: string;
  onSubmit: (text: string) => Promise<void>;
  onCancel: () => void;
}) {
  const [text, setText] = useState(initialText);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed) return;
    setSaving(true);
    try {
      await onSubmit(trimmed);
    } catch (err) {
      console.error("行動記録の保存に失敗しました", err);
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-1.5">
      <input
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Escape") onCancel();
        }}
        autoFocus
        placeholder={placeholder}
        className="min-w-0 flex-1 rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-base text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-black/10 sm:text-sm"
      />
      <button
        type="submit"
        disabled={saving || !text.trim()}
        className="shrink-0 rounded-full bg-gray-900 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {saving ? "保存中" : "保存"}
      </button>
      <button
        type="button"
        onClick={onCancel}
        aria-label="キャンセル"
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-white hover:text-gray-700"
      >
        <X className="h-3.5 w-3.5" strokeWidth={2} />
      </button>
    </form>
  );
}

export default function ActionLogSection({ date }: { date: string }) {
  const { user } = useAuth();
  const { data, error, addItem, updateItem, removeItem } = useActionLog(user?.uid, date);
  const [editing, setEditing] = useState<Editing>(null);
  /** 追加後に入力欄を空にして続けて入力できるよう、key を変えて再マウントする */
  const [addInputKey, setAddInputKey] = useState(0);

  const handleRemove = async (origin: ActionOrigin, item: ActionItem) => {
    if (!window.confirm(`「${item.text}」を削除してもよろしいですか？`)) return;
    try {
      await removeItem(origin, item);
    } catch (err) {
      console.error("行動記録の削除に失敗しました", err);
    }
  };

  return (
    <div className="mb-3 flex flex-col gap-1.5">
      {error && <p className="text-xs font-semibold text-rose-500">{error}</p>}
      {ACTION_ORIGINS.map((origin) => {
        const items = data?.[origin.key] ?? [];
        const isAdding = editing?.origin === origin.key && editing.id === null;
        return (
          <div key={origin.key} className={`rounded-xl px-3 py-2 ${origin.boxClass}`}>
            <div className="flex items-center justify-between gap-2">
              <p className={`flex items-center gap-1.5 text-xs font-bold ${origin.textClass}`}>
                <span className={`h-2 w-2 rounded-full ${origin.dotClass}`} />
                {origin.label}
                {items.length > 0 && <span className="font-semibold opacity-70">{items.length}</span>}
              </p>
              {!isAdding && (
                <button
                  type="button"
                  onClick={() => setEditing({ origin: origin.key, id: null })}
                  className={`flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[11px] font-semibold transition-colors hover:bg-white/70 ${origin.textClass}`}
                >
                  <Plus className="h-3 w-3" strokeWidth={2.5} />
                  追加
                </button>
              )}
            </div>

            {items.length > 0 && (
              <ul className="mt-1.5 flex flex-col gap-1">
                {items.map((item) =>
                  editing?.origin === origin.key && editing.id === item.id ? (
                    <li key={item.id}>
                      <ItemInput
                        initialText={item.text}
                        placeholder={origin.placeholder}
                        onSubmit={async (text) => {
                          await updateItem(origin.key, item.id, text);
                          setEditing(null);
                        }}
                        onCancel={() => setEditing(null)}
                      />
                    </li>
                  ) : (
                    <li
                      key={item.id}
                      className="flex items-start gap-1 rounded-lg bg-white/80 px-2.5 py-1.5"
                    >
                      <p className="min-w-0 flex-1 whitespace-pre-wrap break-words text-sm text-gray-700">
                        {item.text}
                      </p>
                      <button
                        type="button"
                        onClick={() => setEditing({ origin: origin.key, id: item.id })}
                        aria-label="編集"
                        className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700"
                      >
                        <Pencil className="h-3.5 w-3.5" strokeWidth={2} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemove(origin.key, item)}
                        aria-label="削除"
                        className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-gray-100 hover:text-rose-600"
                      >
                        <Trash2 className="h-3.5 w-3.5" strokeWidth={2} />
                      </button>
                    </li>
                  )
                )}
              </ul>
            )}

            {isAdding && (
              <div className="mt-1.5">
                <ItemInput
                  key={addInputKey}
                  initialText=""
                  placeholder={origin.placeholder}
                  onSubmit={async (text) => {
                    await addItem(origin.key, text);
                    setAddInputKey((k) => k + 1);
                  }}
                  onCancel={() => setEditing(null)}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
