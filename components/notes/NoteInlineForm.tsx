"use client";

import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import { ListChecks, Tags } from "lucide-react";
import PendingImagePicker, { revokePendingImages, type PendingImage } from "./PendingImagePicker";
import { continueChecklistOnEnter, toggleChecklistPrefix, UNCATEGORIZED_ID } from "@/lib/notes";
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
  withImages = false,
}: {
  /** 親のアコーディオンが開いているかどうか。true になったタイミングでのみフォーカス・スクロールする */
  active: boolean;
  initialCategoryId: string;
  initialText: string;
  categories: NoteCategoryDoc[];
  /** 呼び出し側で保存処理と、成功時にアコーディオンを閉じる処理まで担う */
  onSave: (categoryId: string, text: string, images: File[]) => Promise<void>;
  onCancel: () => void;
  onManageCategories: () => void;
  submitLabel: string;
  /** true のとき、入力欄の下に「画像を追加」を出す（新規作成用。保存は onSave に渡した画像で呼び出し側が行う） */
  withImages?: boolean;
}) {
  const [categoryId, setCategoryId] = useState(initialCategoryId);
  const [text, setText] = useState(initialText);
  const [pendingImages, setPendingImages] = useState<PendingImage[]>([]);
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
    // 前回選んだ画像（保存済み・キャンセル済み）の一時 URL を解放して空にする
    setPendingImages((prev) => {
      revokePendingImages(prev);
      return [];
    });
    setError(null);
    // フォームは閉じてもアンマウントされないため、前回の保存成功時の saving が残らないよう戻す
    setSaving(false);

    // アコーディオンが展開し終わる頃にフォーカスし、スマホでもキーボードに隠れないようスクロールする
    const timer = setTimeout(() => {
      textareaRef.current?.focus();
      textareaRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 200);
    return () => clearTimeout(timer);
  }, [active, initialCategoryId, initialText]);

  const resolvedCategoryId =
    categoryId !== UNCATEGORIZED_ID && !categories.some((c) => c.id === categoryId) ? UNCATEGORIZED_ID : categoryId;

  /** 本文を書き換えたあと、指定位置にカーソルを戻す */
  const applyText = (next: string, selStart: number, selEnd = selStart) => {
    setText(next);
    requestAnimationFrame(() => {
      const el = textareaRef.current;
      if (!el) return;
      el.focus();
      el.setSelectionRange(selStart, selEnd);
    });
  };

  /** カーソルのある行（選択中は選択範囲の行すべて）をチェック項目にする／戻す */
  const handleToggleChecklist = () => {
    const el = textareaRef.current;
    const start = el?.selectionStart ?? text.length;
    const end = el?.selectionEnd ?? text.length;
    const result = toggleChecklistPrefix(text, start, end);
    applyText(result.text, result.start, result.end);
  };

  /** チェック項目の行で改行したら、次の行にもチェックボックスを付ける（日本語変換の確定 Enter は除く） */
  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key !== "Enter" || e.shiftKey || e.nativeEvent.isComposing || e.keyCode === 229) return;
    const el = e.currentTarget;
    if (el.selectionStart !== el.selectionEnd) return;
    const result = continueChecklistOnEnter(text, el.selectionStart);
    if (!result) return;
    e.preventDefault();
    applyText(result.text, result.cursor);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed || saving) return;

    setSaving(true);
    setError(null);
    try {
      await onSave(
        resolvedCategoryId,
        trimmed,
        pendingImages.map((image) => image.file)
      );
    } catch (err) {
      console.error("ノートの保存に失敗しました", err);
      setError("保存に失敗しました。もう一度お試しください。");
    } finally {
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

      <div className="-mb-1 flex items-center justify-between">
        <span className="text-xs font-semibold text-gray-500">本文</span>
        <button
          type="button"
          // ボタンを押してもテキスト欄のカーソル位置（フォーカス）を失わないようにする
          onMouseDown={(e) => e.preventDefault()}
          onClick={handleToggleChecklist}
          className="flex items-center gap-1 rounded-full border border-gray-200 px-2.5 py-1 text-[11px] font-semibold text-gray-500 transition-colors hover:bg-gray-50 hover:text-gray-800"
        >
          <ListChecks className="h-3.5 w-3.5" strokeWidth={2} />
          チェックリスト
        </button>
      </div>

      <textarea
        ref={textareaRef}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKeyDown}
        rows={16}
        placeholder="自由にメモを書こう。URLを含めると自動でリンクになるよ。「チェックリスト」でチェックできる箇条書きも作れるよ..."
        className="max-h-[60svh] w-full resize-none rounded-lg border border-gray-300 px-3 py-2 text-base text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-black/20"
      />

      {withImages && (
        <PendingImagePicker images={pendingImages} onChange={setPendingImages} disabled={saving} />
      )}

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
