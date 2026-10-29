"use client";

import { useMemo } from "react";
import InlineAccordion from "@/components/notes/InlineAccordion";
import VideoInlineForm from "./VideoInlineForm";
import type { NoteCategoryDoc, VideoInput } from "@/lib/types";

/**
 * 新規登録のフォーム。開閉ボタンはページ見出しの横にあり、開いている間だけカードとして展開する
 */
export default function NewVideoCard({
  open,
  onClose,
  categories,
  initialCategoryId,
  onCreate,
  onManageCategories,
}: {
  open: boolean;
  onClose: () => void;
  categories: NoteCategoryDoc[];
  initialCategoryId: string;
  onCreate: (input: VideoInput) => Promise<void>;
  onManageCategories: () => void;
}) {
  const initialVideo = useMemo<VideoInput>(
    () => ({ url: "", title: "", channelName: "", channelUrl: "", channelIconUrl: "", categoryId: initialCategoryId, memo: "" }),
    [initialCategoryId]
  );

  const handleSave = async (input: VideoInput) => {
    await onCreate(input);
    onClose();
  };

  // 閉じている間は高さ0になるので、親の gap 分の余白も打ち消して詰める
  return (
    <div className={`transition-[margin] duration-300 ease-in-out ${open ? "" : "-mt-3"}`}>
      <InlineAccordion open={open}>
        <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-4">
          <p className="text-xs font-semibold text-gray-500">新規登録</p>
          <VideoInlineForm
            active={open}
            initialVideo={initialVideo}
            categories={categories}
            onSave={handleSave}
            onCancel={onClose}
            onManageCategories={onManageCategories}
            submitLabel="追加"
          />
        </div>
      </InlineAccordion>
    </div>
  );
}
