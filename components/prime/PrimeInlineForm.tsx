"use client";

import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { ImagePlus, Loader2, Tags, X } from "lucide-react";
import { UNCATEGORIZED_ID } from "@/lib/notes";
import { compressImageToDataUrl } from "@/lib/image-compress";
import type { NoteCategoryDoc, PrimeVideoInput } from "@/lib/types";

const inputClassName =
  "w-full rounded-lg border border-gray-300 px-3 py-2 text-base text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-black/20";

/** カードの画像は小さく表示するだけなので、長辺をこのピクセル数まで縮めて軽くする */
const THUMBNAIL_EDGE = 480;

/** http(s) のURLかどうか。プライムビデオのリンクはアプリ用・ブラウザ用など形が色々あるので、URLであれば受け付ける */
function isHttpUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

export default function PrimeInlineForm({
  active,
  initialItem,
  categories,
  onSave,
  onCancel,
  onManageCategories,
  submitLabel,
}: {
  /** 親のアコーディオンが開いているかどうか。true になったタイミングでのみ初期化・フォーカスする */
  active: boolean;
  initialItem: PrimeVideoInput;
  categories: NoteCategoryDoc[];
  /** 呼び出し側で保存処理と、成功時にアコーディオンを閉じる処理まで担う */
  onSave: (input: PrimeVideoInput) => Promise<void>;
  onCancel: () => void;
  onManageCategories: () => void;
  submitLabel: string;
}) {
  const [url, setUrl] = useState(initialItem.url);
  const [title, setTitle] = useState(initialItem.title);
  const [imageDataUrl, setImageDataUrl] = useState(initialItem.imageDataUrl);
  const [categoryId, setCategoryId] = useState(initialItem.categoryId);
  const [memo, setMemo] = useState(initialItem.memo);
  const [compressing, setCompressing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const urlInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const wasActiveRef = useRef(false);

  // 閉→開に切り替わった瞬間だけ初期値へリセットしてフォーカスする
  useEffect(() => {
    if (!active) {
      wasActiveRef.current = false;
      return;
    }
    if (wasActiveRef.current) return;
    wasActiveRef.current = true;

    setUrl(initialItem.url);
    setTitle(initialItem.title);
    setImageDataUrl(initialItem.imageDataUrl);
    setCategoryId(initialItem.categoryId);
    setMemo(initialItem.memo);
    setError(null);

    const timer = setTimeout(() => {
      urlInputRef.current?.focus();
      urlInputRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 200);
    return () => clearTimeout(timer);
  }, [active, initialItem]);

  const handleImageChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    // 同じ画像を選び直しても change が起きるように空にしておく
    e.target.value = "";
    if (!file) return;
    setCompressing(true);
    setError(null);
    try {
      setImageDataUrl(await compressImageToDataUrl(file, THUMBNAIL_EDGE));
    } catch (err) {
      console.error("画像の圧縮に失敗しました", err);
      setError("画像を読み込めませんでした。別の画像でお試しください。");
    } finally {
      setCompressing(false);
    }
  };

  const trimmedUrl = url.trim();
  const isValidUrl = isHttpUrl(trimmedUrl);
  const canSave = isValidUrl && title.trim() !== "" && !saving && !compressing;
  const resolvedCategoryId =
    categoryId !== UNCATEGORIZED_ID && !categories.some((c) => c.id === categoryId) ? UNCATEGORIZED_ID : categoryId;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!canSave) return;

    setSaving(true);
    setError(null);
    try {
      await onSave({
        url: trimmedUrl,
        title: title.trim(),
        imageDataUrl,
        categoryId: resolvedCategoryId,
        memo: memo.trim(),
      });
      setSaving(false);
    } catch (err) {
      console.error("アマプラの保存に失敗しました", err);
      setError("保存に失敗しました。もう一度お試しください。");
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3 pt-3">
      <div>
        <label className="mb-1.5 block text-xs font-semibold text-gray-500">プライムビデオのURL</label>
        <input
          ref={urlInputRef}
          type="url"
          inputMode="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://www.amazon.co.jp/gp/video/detail/..."
          className={inputClassName}
        />
        {trimmedUrl !== "" && !isValidUrl && (
          <p className="mt-1 text-[11px] font-medium text-rose-500">https:// から始まるURLを入力してください</p>
        )}
      </div>

      <div>
        <label className="mb-1.5 block text-xs font-semibold text-gray-500">作品名</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="作品名を入力"
          className={inputClassName}
        />
      </div>

      <div>
        <label className="mb-1.5 block text-xs font-semibold text-gray-500">画像（任意）</label>
        <div className="flex items-center gap-2">
          {imageDataUrl ? (
            <div className="relative h-14 w-24 shrink-0 overflow-hidden rounded-lg bg-gray-100">
              {/* eslint-disable-next-line @next/next/no-img-element -- data URL をそのまま表示する */}
              <img src={imageDataUrl} alt="" className="h-full w-full object-cover" />
              <button
                type="button"
                onClick={() => setImageDataUrl("")}
                className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-white transition-colors hover:bg-black/80"
                aria-label="画像を外す"
              >
                <X className="h-3 w-3" strokeWidth={2.5} />
              </button>
            </div>
          ) : null}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={compressing}
            className="flex items-center gap-1.5 rounded-full border border-gray-300 px-3 py-1.5 text-xs font-semibold text-gray-600 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {compressing ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" strokeWidth={2.5} />
            ) : (
              <ImagePlus className="h-3.5 w-3.5" strokeWidth={2} />
            )}
            {imageDataUrl ? "画像を変更" : "画像を追加"}
          </button>
          <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
        </div>
      </div>

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
        <select value={resolvedCategoryId} onChange={(e) => setCategoryId(e.target.value)} className={inputClassName}>
          <option value={UNCATEGORIZED_ID}>未分類</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
      </div>

      <textarea
        value={memo}
        onChange={(e) => setMemo(e.target.value)}
        rows={2}
        placeholder="メモ（任意）"
        className={`${inputClassName} resize-none`}
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
          disabled={!canSave}
          className="rounded-full bg-black px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-gray-800 disabled:cursor-not-allowed disabled:bg-gray-300"
        >
          {saving ? "保存中..." : submitLabel}
        </button>
      </div>
    </form>
  );
}
