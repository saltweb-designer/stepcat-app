"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Trash2, X } from "lucide-react";
import AppIcon from "./AppIcon";
import { normalizeHttpUrl } from "@/lib/app-links";
import type { AppLinkInput } from "@/hooks/useAppLinks";
import type { AppLinkDoc } from "@/lib/types";

const inputClassName =
  "w-full rounded-lg border border-gray-300 px-3 py-2 text-base text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-black/20";

export default function AppLinkFormModal({
  initialApp,
  onSave,
  onDelete,
  onClose,
}: {
  /** 指定されている場合は編集モード */
  initialApp?: AppLinkDoc;
  onSave: (input: AppLinkInput) => Promise<void>;
  onDelete?: () => Promise<void>;
  onClose: () => void;
}) {
  const isEdit = !!initialApp;
  const [name, setName] = useState(initialApp?.name ?? "");
  const [href, setHref] = useState(initialApp?.href ?? "");
  const [iconUrl, setIconUrl] = useState(initialApp?.iconUrl ?? "");
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

  const previewHref = normalizeHttpUrl(href);
  const previewIcon = normalizeHttpUrl(iconUrl) ?? "";

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (saving) return;
    const trimmedName = name.trim();
    const normalizedHref = normalizeHttpUrl(href);
    if (!trimmedName || !normalizedHref) {
      setError("アプリ名と正しいURLを入力してください。");
      return;
    }
    const normalizedIcon = iconUrl.trim() ? normalizeHttpUrl(iconUrl) : "";
    if (normalizedIcon === null) {
      setError("アイコン画像のURLが正しくありません。");
      return;
    }

    setSaving(true);
    setError(null);
    try {
      await onSave({ name: trimmedName, href: normalizedHref, iconUrl: normalizedIcon });
      onClose();
    } catch (err) {
      console.error("関連アプリの保存に失敗しました", err);
      setError("保存に失敗しました。もう一度お試しください。");
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!onDelete || saving) return;
    if (!window.confirm(`「${initialApp?.name}」を関連アプリから削除してもよろしいですか？`)) return;
    setSaving(true);
    try {
      await onDelete();
      onClose();
    } catch (err) {
      console.error("関連アプリの削除に失敗しました", err);
      setError("削除に失敗しました。もう一度お試しください。");
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="app-link-form-title"
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[90vh] w-full flex-col overflow-hidden rounded-t-2xl bg-white shadow-2xl sm:max-w-md sm:rounded-2xl"
      >
        <header className="flex shrink-0 items-center justify-between border-b border-gray-100 px-5 py-4">
          <h2 id="app-link-form-title" className="text-base font-semibold text-gray-900">
            {isEdit ? "関連アプリを編集" : "関連アプリを追加"}
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
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <span className="relative h-14 w-14 shrink-0 overflow-hidden rounded-2xl bg-gray-100 shadow-sm">
                {previewHref ? (
                  <AppIcon key={`${previewHref}|${previewIcon}`} name={name} href={previewHref} iconSrc={previewIcon} />
                ) : null}
              </span>
              <p className="text-xs leading-relaxed text-gray-500">
                アイコン画像を指定しない場合は、サイトのアイコン（ファビコン）を自動で表示します。
              </p>
            </div>

            <div>
              <label htmlFor="app-link-name" className="mb-1.5 block text-xs font-semibold text-gray-500">
                アプリ名
              </label>
              <input
                id="app-link-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="例：家計簿アプリ"
                className={inputClassName}
              />
            </div>

            <div>
              <label htmlFor="app-link-href" className="mb-1.5 block text-xs font-semibold text-gray-500">
                URL
              </label>
              <input
                id="app-link-href"
                type="url"
                inputMode="url"
                value={href}
                onChange={(e) => setHref(e.target.value)}
                placeholder="https://"
                className={inputClassName}
              />
            </div>

            <div>
              <label htmlFor="app-link-icon" className="mb-1.5 block text-xs font-semibold text-gray-500">
                アイコン画像のURL（任意）
              </label>
              <input
                id="app-link-icon"
                type="url"
                inputMode="url"
                value={iconUrl}
                onChange={(e) => setIconUrl(e.target.value)}
                placeholder="https://.../icon.png"
                className={inputClassName}
              />
            </div>
          </div>

          {error && <p className="mt-4 text-xs font-medium text-rose-600">{error}</p>}

          <div className="mt-6 flex items-center justify-end gap-2 border-t border-gray-100 pt-4">
            {isEdit && onDelete && (
              <button
                type="button"
                onClick={handleDelete}
                disabled={saving}
                className="mr-auto flex items-center gap-1.5 rounded-full px-3 py-2 text-sm font-medium text-rose-500 transition-colors hover:bg-rose-50 disabled:opacity-60"
              >
                <Trash2 className="h-4 w-4" strokeWidth={2} />
                削除
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="rounded-full border border-gray-300 px-4 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50"
            >
              キャンセル
            </button>
            <button
              type="submit"
              disabled={name.trim() === "" || href.trim() === "" || saving}
              className="rounded-full bg-black px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-gray-800 disabled:cursor-not-allowed disabled:bg-gray-300"
            >
              {saving ? "保存中..." : isEdit ? "更新" : "追加"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
