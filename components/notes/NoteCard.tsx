"use client";

import { useState } from "react";
import { Copy, Pencil, Trash2 } from "lucide-react";
import NoteText from "./NoteText";
import type { NoteDoc } from "@/lib/types";

export default function NoteCard({
  note,
  categoryName,
  onEdit,
  onDuplicate,
  onDelete,
}: {
  note: NoteDoc;
  categoryName: string;
  onEdit: () => void;
  onDuplicate: () => Promise<void>;
  onDelete: () => Promise<void>;
}) {
  const [duplicating, setDuplicating] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleDuplicate = async () => {
    if (duplicating) return;
    setDuplicating(true);
    try {
      await onDuplicate();
    } catch (err) {
      console.error("ノートの複製に失敗しました", err);
    } finally {
      setDuplicating(false);
    }
  };

  const handleDelete = async () => {
    if (deleting) return;
    if (!window.confirm("このノートを削除してもよろしいですか？")) return;
    setDeleting(true);
    try {
      await onDelete();
    } catch (err) {
      console.error("ノートの削除に失敗しました", err);
      setDeleting(false);
    }
  };

  return (
    <div className="flex min-w-0 flex-col gap-2 rounded-2xl border border-gray-200/70 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <span className="inline-flex shrink-0 items-center rounded-full bg-gray-100 px-2.5 py-1 text-[11px] font-semibold text-gray-500">
          {categoryName}
        </span>
        <div className="flex shrink-0 items-center gap-0.5">
          <button
            type="button"
            onClick={onEdit}
            className="flex h-7 w-7 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700"
            aria-label="編集"
          >
            <Pencil className="h-3.5 w-3.5" strokeWidth={2} />
          </button>
          <button
            type="button"
            onClick={handleDuplicate}
            disabled={duplicating}
            className="flex h-7 w-7 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700 disabled:cursor-not-allowed disabled:opacity-60"
            aria-label="複製"
          >
            <Copy className="h-3.5 w-3.5" strokeWidth={2} />
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
      <NoteText text={note.text} className="text-gray-700" />
    </div>
  );
}
