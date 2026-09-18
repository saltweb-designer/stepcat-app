"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Tags, X } from "lucide-react";
import { UNCATEGORIZED_ID } from "@/lib/notes";
import type { NoteCategoryDoc, NoteDoc } from "@/lib/types";

export default function NoteFormModal({
  initialNote,
  initialCategoryId,
  categories,
  onSave,
  onManageCategories,
  onClose,
}: {
  initialNote?: NoteDoc;
  /** 新規作成時、フィルター中のカテゴリを初期選択にする */
  initialCategoryId?: string;
  categories: NoteCategoryDoc[];
  onSave: (categoryId: string, text: string) => Promise<void>;
  onManageCategories: () => void;
  onClose: () => void;
}) {
  const isEdit = !!initialNote;
  const [categoryId, setCategoryId] = useState(initialNote?.categoryId ?? initialCategoryId ?? UNCATEGORIZED_ID);
  const [text, setText] = useState(initialNote?.text ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  // 選択中のカテゴリが削除されていた場合は未分類として扱う
  const resolvedCategoryId =
    categoryId !== UNCATEGORIZED_ID && !categories.some((c) => c.id === categoryId) ? UNCATEGORIZED_ID : categoryId;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed || saving) return;

    setSaving(true);
    setError(null);
    try {
      await onSave(resolvedCategoryId, trimmed);
      onClose();
    } catch (err) {
      console.error("ノートの保存に失敗しました", err);
      setError("保存に失敗しました。もう一度お試しください。");
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm p-0 sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="note-form-title"
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[90vh] w-full flex-col overflow-hidden rounded-t-2xl bg-white shadow-2xl sm:max-w-lg sm:rounded-2xl"
      >
        <header className="flex shrink-0 items-center justify-between border-b border-gray-100 px-5 py-4">
          <h2 id="note-form-title" className="text-base font-semibold text-gray-900">
            {isEdit ? "ノートを編集" : "ノートを追加"}
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

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-5 py-4">
          <div className="flex flex-col gap-5">
            <div>
              <div className="mb-2 flex items-center justify-between">
                <label htmlFor="note-category" className="text-xs font-semibold text-gray-500">
                  カテゴリ
                </label>
                <button
                  type="button"
                  onClick={onManageCategories}
                  className="flex items-center gap-1 text-[11px] font-semibold text-gray-400 transition-colors hover:text-gray-700"
                >
                  <Tags className="h-3 w-3" strokeWidth={2} />
                  カテゴリを管理
                </button>
              </div>
              <select
                id="note-category"
                value={resolvedCategoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-base text-gray-700 focus:outline-none focus:ring-2 focus:ring-black/20"
              >
                <option value={UNCATEGORIZED_ID}>未分類</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="note-text" className="mb-1.5 block text-xs font-semibold text-gray-500">
                本文
              </label>
              <textarea
                id="note-text"
                value={text}
                onChange={(e) => setText(e.target.value)}
                rows={8}
                autoFocus
                placeholder="自由にメモを書こう。URLを含めると自動でリンクになるよ..."
                className="w-full resize-none rounded-lg border border-gray-300 px-3 py-2 text-base text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-black/20"
              />
            </div>
          </div>

          <div className="mt-6 flex items-center justify-end gap-2 border-t border-gray-100 pt-4">
            {error && <p className="mr-auto text-xs font-medium text-rose-600">{error}</p>}
            <button
              type="button"
              onClick={onClose}
              className="rounded-full border border-gray-300 px-4 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50"
            >
              キャンセル
            </button>
            <button
              type="submit"
              disabled={text.trim() === "" || saving}
              className="rounded-full bg-black px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-gray-800 disabled:cursor-not-allowed disabled:bg-gray-300"
            >
              {saving ? (isEdit ? "更新中..." : "保存中...") : isEdit ? "更新" : "保存"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
