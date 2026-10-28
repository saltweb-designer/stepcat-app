"use client";

import { useMemo, useState } from "react";
import { Plus } from "lucide-react";
import InlineAccordion from "@/components/notes/InlineAccordion";
import VideoInlineForm from "./VideoInlineForm";
import type { NoteCategoryDoc, VideoInput } from "@/lib/types";

export default function NewVideoCard({
  categories,
  initialCategoryId,
  onCreate,
  onManageCategories,
}: {
  categories: NoteCategoryDoc[];
  initialCategoryId: string;
  onCreate: (input: VideoInput) => Promise<void>;
  onManageCategories: () => void;
}) {
  const [open, setOpen] = useState(false);
  const initialVideo = useMemo<VideoInput>(
    () => ({ url: "", title: "", channelName: "", channelUrl: "", channelIconUrl: "", categoryId: initialCategoryId, memo: "" }),
    [initialCategoryId]
  );

  const handleSave = async (input: VideoInput) => {
    await onCreate(input);
    setOpen(false);
  };

  return (
    <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-4 shadow-sm">
      {open ? (
        <p className="text-xs font-semibold text-gray-500">新規登録</p>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex w-full items-center justify-center gap-1.5 py-1 text-sm font-semibold text-gray-500 transition-colors hover:text-gray-800"
        >
          <Plus className="h-4 w-4" strokeWidth={2.5} />
          新規登録
        </button>
      )}

      <InlineAccordion open={open}>
        <VideoInlineForm
          active={open}
          initialVideo={initialVideo}
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
