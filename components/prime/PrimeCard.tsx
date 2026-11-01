"use client";

import { useState } from "react";
import { ExternalLink, Pencil, Pin, Trash2 } from "lucide-react";
import InlineAccordion from "@/components/notes/InlineAccordion";
import NoteText from "@/components/notes/NoteText";
import PrimeInlineForm from "./PrimeInlineForm";
import { primeGenreLabel } from "@/lib/prime-genres";
import type { NoteCategoryDoc, PrimeVideoDoc, PrimeVideoInput } from "@/lib/types";

/**
 * アマプラの作品リンクのカード。アプリ内では再生しないので小さく表示し、
 * 画像・作品名を押すとプライムビデオ（アプリがなければブラウザ）を開く
 */
export default function PrimeCard({
  item,
  categoryName,
  categories,
  onSave,
  onDelete,
  onTogglePin,
  onManageCategories,
}: {
  item: PrimeVideoDoc;
  categoryName: string;
  categories: NoteCategoryDoc[];
  onSave: (input: PrimeVideoInput) => Promise<void>;
  onDelete: () => Promise<void>;
  onTogglePin: () => Promise<void>;
  onManageCategories: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (deleting) return;
    if (!window.confirm("このアマプラを削除してもよろしいですか？")) return;
    setDeleting(true);
    try {
      await onDelete();
    } catch (err) {
      console.error("アマプラの削除に失敗しました", err);
      setDeleting(false);
    }
  };

  const handleTogglePin = async () => {
    try {
      await onTogglePin();
    } catch (err) {
      console.error("ピン留めの切り替えに失敗しました", err);
    }
  };

  const handleSave = async (input: PrimeVideoInput) => {
    await onSave(input);
    setEditing(false);
  };

  return (
    <div className="flex min-w-0 flex-col rounded-2xl border border-gray-200/70 bg-white p-2.5 shadow-sm">
      <div className="flex items-center gap-2.5">
        <a
          href={item.url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex min-w-0 flex-1 items-center gap-2.5"
        >
          {item.imageDataUrl && (
            <div className="h-12 w-20 shrink-0 overflow-hidden rounded-lg bg-gray-100">
              {/* eslint-disable-next-line @next/next/no-img-element -- data URL をそのまま表示する */}
              <img src={item.imageDataUrl} alt="" className="h-full w-full object-cover" />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="flex items-center gap-1 text-sm font-semibold leading-snug text-gray-900">
              <span className="line-clamp-2">{item.title || "作品名なし"}</span>
              <ExternalLink className="h-3 w-3 shrink-0 text-gray-400" strokeWidth={2} />
            </p>
            <div className="mt-0.5 flex flex-wrap gap-1">
              <span className="inline-flex items-center rounded-full bg-gray-800 px-2 py-0.5 text-[10px] font-semibold text-white">
                {primeGenreLabel(item.genre)}
              </span>
              <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-semibold text-gray-500">
                {categoryName}
              </span>
            </div>
          </div>
        </a>
        {!editing && (
          <div className="flex shrink-0 items-center gap-0.5">
            <button
              type="button"
              onClick={handleTogglePin}
              className={`flex h-7 w-7 items-center justify-center rounded-full transition-colors hover:bg-gray-100 ${
                item.pinned ? "text-amber-500 hover:text-amber-600" : "text-gray-400 hover:text-gray-700"
              }`}
              aria-label={item.pinned ? "ピン留めを外す" : "ピン留め"}
              aria-pressed={item.pinned}
            >
              <Pin className={`h-3.5 w-3.5 ${item.pinned ? "fill-current" : ""}`} strokeWidth={2} />
            </button>
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="flex h-7 w-7 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700"
              aria-label="編集"
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
        )}
      </div>

      {!editing && item.memo && <NoteText text={item.memo} className="mt-1.5 px-0.5 text-xs text-gray-600" />}

      <InlineAccordion open={editing}>
        <PrimeInlineForm
          active={editing}
          initialItem={item}
          categories={categories}
          onSave={handleSave}
          onCancel={() => setEditing(false)}
          onManageCategories={onManageCategories}
          submitLabel="更新"
        />
      </InlineAccordion>
    </div>
  );
}
