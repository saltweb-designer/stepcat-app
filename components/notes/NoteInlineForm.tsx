"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { Tags } from "lucide-react";
import { UNCATEGORIZED_ID } from "@/lib/notes";
import type { NoteCategoryDoc } from "@/lib/types";

export default function NoteInlineForm({
  active,
  initialCategoryId,
  initialText,
  categories,
  onSave,
  onCancel,
  onManageCategories,
  submitLabel,
}: {
  /** 親のアコーディオンが開いているかどうか。true になったタイミングでのみフォーカス・スクロールする */
  active: boolean;
  initialCategoryId: string;
  initialText: string;
  categories: NoteCategoryDoc[];
  /** 呼び出し側で保存処理と、成功時にアコーディオンを閉じる処理まで担う */
  onSave: (categoryId: string, text: string) => Promise<void>;
  onCancel: () => void;
  onManageCategories: () => void;
  submitLabel: string;
}) {
  const [categoryId, setCategoryId] = useState(initialCategoryId);
  const [text, setText] = useState(initialText);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const wasActiveRef = useRef(false);

  // 閉→開に切り替わった瞬間だけ初期値へリセットしてフォーカスする。
  // 開いている間に initialCategoryId/initialText が変化しても、入力中のドラフトは失われない。
  useEffect(() => {
    if (!active) {
      wasActiveRef.current = false;
      return;
    }
    if (wasActiveRef.current) return;
    wasActiveRef.current = true;

    setCategoryId(initialCategoryId);
    setText(initialText);
    setError(null);

    // アコーディオンが展開し終わる頃にフォーカスし、スマホでもキーボードに隠れないようスクロールする
    const timer = setTimeout(() => {
      textareaRef.current?.focus();
      textareaRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 200);
    return () => clearTimeout(timer);
  }, [active, initialCategoryId, initialText]);

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
    } catch (err) {
      console.error("ノートの保存に失敗しました", err);
      setError("保存に失敗しました。もう一度お試しください。");
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3 pt-3">
      <div>
        <div className="mb-1.5 flex items-center justify-between">
          <label className="text-xs font-semibold text-gray-500">カテゴリ</label>
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

      <textarea
        ref={textareaRef}
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={5}
        placeholder="自由にメモを書こう。URLを含めると自動でリンクになるよ..."
        className="w-full resize-none rounded-lg border border-gray-300 px-3 py-2 text-base text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-black/20"
      />

      <div className="flex items-center justify-end gap-2">
        {error && <p className="mr-auto text-xs font-medium text-rose-600">{error}</p>}
        <button
          type="button"
          onClick={onCancel}
          className="rounded-full border border-gray-300 px-4 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50"
        >
          キャンセル
        </button>
        <button
          type="submit"
          disabled={text.trim() === "" || saving}
          className="rounded-full bg-black px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-gray-800 disabled:cursor-not-allowed disabled:bg-gray-300"
        >
          {saving ? "保存中..." : submitLabel}
        </button>
      </div>
    </form>
  );
}
