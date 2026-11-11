"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import InlineAccordion from "./InlineAccordion";
import NoteInlineForm from "./NoteInlineForm";
import { useAuth } from "@/contexts/AuthContext";
import { addNoteImages } from "@/hooks/useNoteImages";
import type { NoteCategoryDoc } from "@/lib/types";

export default function NewNoteCard({
  categories,
  initialCategoryId,
  onCreate,
  onManageCategories,
}: {
  categories: NoteCategoryDoc[];
  initialCategoryId: string;
  /** 作成したノートの ID を返す（選んだ画像をそのノートに紐づけるため） */
  onCreate: (categoryId: string, text: string) => Promise<string | undefined>;
  onManageCategories: () => void;
}) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);

  const handleSave = async (categoryId: string, text: string, images: File[]) => {
    const noteId = await onCreate(categoryId, text);
    // ノート本文は保存済みなので、画像の保存に失敗してもフォームは閉じる（再送でノートが二重にできないように）
    if (noteId && user && images.length > 0) {
      try {
        await addNoteImages(user.uid, noteId, images);
      } catch (err) {
        console.error("画像の保存に失敗しました", err);
        window.alert("ノートは保存しましたが、画像の保存に失敗しました。カードの「画像を追加」から追加し直してください。");
      }
    }
    setOpen(false);
  };

  return (
    <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-4 shadow-sm">
      {open ? (
        <p className="text-xs font-semibold text-gray-500">新規ノート</p>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex w-full items-center justify-center gap-1.5 py-1 text-sm font-semibold text-gray-500 transition-colors hover:text-gray-800"
        >
          <Plus className="h-4 w-4" strokeWidth={2.5} />
          新規ノートを追加
        </button>
      )}

      <InlineAccordion open={open}>
        <NoteInlineForm
          active={open}
          initialCategoryId={initialCategoryId}
          initialText=""
          categories={categories}
          onSave={handleSave}
          onCancel={() => setOpen(false)}
          onManageCategories={onManageCategories}
          submitLabel="追加"
          withImages
        />
      </InlineAccordion>
    </div>
  );
}
