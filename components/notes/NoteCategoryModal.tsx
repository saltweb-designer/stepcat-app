"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Check, Pencil, Plus, Trash2, X } from "lucide-react";
import type { NoteCategoryDoc } from "@/lib/types";

function CategoryRow({
  category,
  onRename,
  onDelete,
}: {
  category: NoteCategoryDoc;
  onRename: (name: string) => Promise<void>;
  onDelete: () => Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(category.name);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleSave = async () => {
    const trimmed = draft.trim();
    if (!trimmed) return;
    setSaving(true);
    try {
      await onRename(trimmed);
      setEditing(false);
    } catch (err) {
      console.error("カテゴリの更新に失敗しました", err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(`「${category.name}」を削除しますか？このカテゴリのノートは未分類になります。`)) return;
    setDeleting(true);
    try {
      await onDelete();
    } catch (err) {
      console.error("カテゴリの削除に失敗しました", err);
      setDeleting(false);
    }
  };

  if (editing) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-gray-200 px-2.5 py-2">
        <input
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          autoFocus
          className="min-w-0 flex-1 rounded-md border border-gray-300 px-2 py-1 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-black/20"
        />
        <button
          type="button"
          onClick={handleSave}
          disabled={saving || draft.trim() === ""}
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-emerald-50 hover:text-emerald-600 disabled:cursor-not-allowed disabled:opacity-60"
          aria-label="保存"
        >
          <Check className="h-4 w-4" strokeWidth={2} />
        </button>
        <button
          type="button"
          onClick={() => {
            setDraft(category.name);
            setEditing(false);
          }}
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-gray-100"
          aria-label="キャンセル"
        >
          <X className="h-4 w-4" strokeWidth={2} />
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between gap-2 rounded-lg border border-gray-200 px-2.5 py-2">
      <span className="min-w-0 flex-1 truncate text-sm text-gray-700">{category.name}</span>
      <div className="flex shrink-0 items-center gap-0.5">
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="flex h-7 w-7 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700"
          aria-label="名前を変更"
        >
          <Pencil className="h-3.5 w-3.5" strokeWidth={2} />
        </button>
        <button
          type="button"
          onClick={handleDelete}
          disabled={deleting}
          className="flex h-7 w-7 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-rose-50 hover:text-rose-500 disabled:cursor-not-allowed disabled:opacity-60"
          aria-label="削除"
        >
          <Trash2 className="h-3.5 w-3.5" strokeWidth={2} />
        </button>
      </div>
    </div>
  );
}

export default function NoteCategoryModal({
  categories,
  onAdd,
  onRename,
  onDelete,
  onClose,
}: {
  categories: NoteCategoryDoc[];
  onAdd: (name: string) => Promise<void>;
  onRename: (id: string, name: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onClose: () => void;
}) {
  const [newName, setNewName] = useState("");
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const handleAdd = async (e: FormEvent) => {
    e.preventDefault();
    const trimmed = newName.trim();
    if (!trimmed || adding) return;
    setAdding(true);
    try {
      await onAdd(trimmed);
      setNewName("");
    } catch (err) {
      console.error("カテゴリの追加に失敗しました", err);
    } finally {
      setAdding(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center bg-black/40 backdrop-blur-sm p-0 sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="note-category-title"
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[85vh] w-full flex-col overflow-hidden rounded-t-2xl bg-white shadow-2xl sm:max-w-sm sm:rounded-2xl"
      >
        <header className="flex shrink-0 items-center justify-between border-b border-gray-100 px-5 py-4">
          <h2 id="note-category-title" className="text-base font-semibold text-gray-900">
            カテゴリを管理
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
            aria-label="閉じる"
          >
            <X className="h-5 w-5" strokeWidth={2} />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          <div className="flex flex-col gap-2">
            {categories.length === 0 && (
              <p className="py-2 text-sm text-gray-400">まだカテゴリがありません</p>
            )}
            {categories.map((category) => (
              <CategoryRow
                key={category.id}
                category={category}
                onRename={(name) => onRename(category.id, name)}
                onDelete={() => onDelete(category.id)}
              />
            ))}
          </div>

          <form onSubmit={handleAdd} className="mt-4 flex items-center gap-2 border-t border-gray-100 pt-4">
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="新しいカテゴリ名"
              className="min-w-0 flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-black/20"
            />
            <button
              type="submit"
              disabled={newName.trim() === "" || adding}
              className="flex shrink-0 items-center gap-1 rounded-full bg-black px-3.5 py-2 text-sm font-medium text-white transition-colors hover:bg-gray-800 disabled:cursor-not-allowed disabled:bg-gray-300"
            >
              <Plus className="h-3.5 w-3.5" strokeWidth={2.5} />
              追加
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
