"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import InlineAccordion from "./InlineAccordion";
import NoteInlineForm from "./NoteInlineForm";
import type { NoteCategoryDoc } from "@/lib/types";

export default function NewNoteCard({
  categories,
  initialCategoryId,
  onCreate,
  onManageCategories,
}: {
  categories: NoteCategoryDoc[];
  initialCategoryId: string;
  onCreate: (categoryId: string, text: string) => Promise<void>;
  onManageCategories: () => void;
}) {
  const [open, setOpen] = useState(false);

  const handleSave = async (categoryId: string, text: string) => {
    await onCreate(categoryId, text);
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
        />
      </InlineAccordion>
    </div>
  );
}
