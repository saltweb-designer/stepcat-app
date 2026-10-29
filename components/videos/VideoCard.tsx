"use client";

import { useState } from "react";
import { Pencil, Pin, Trash2 } from "lucide-react";
import InlineAccordion from "@/components/notes/InlineAccordion";
import NoteText from "@/components/notes/NoteText";
import YouTubeEmbed from "@/components/notes/YouTubeEmbed";
import ChannelAvatar from "./ChannelAvatar";
import VideoInlineForm from "./VideoInlineForm";
import { parseYouTubeUrl } from "@/lib/youtube";
import type { NoteCategoryDoc, VideoDoc, VideoInput } from "@/lib/types";

export default function VideoCard({
  video,
  categoryName,
  categories,
  onSave,
  onDelete,
  onTogglePin,
  onManageCategories,
  onPlay,
  itemLabel = "動画",
}: {
  video: VideoDoc;
  categoryName: string;
  categories: NoteCategoryDoc[];
  onSave: (input: VideoInput) => Promise<void>;
  onDelete: () => Promise<void>;
  onTogglePin: () => Promise<void>;
  onManageCategories: () => void;
  /** サムネイルを押して再生を始めたとき */
  onPlay?: () => void;
  /** 削除確認メッセージに使う呼び名（動画・音楽） */
  itemLabel?: string;
}) {
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const embed = parseYouTubeUrl(video.url);

  const handleDelete = async () => {
    if (deleting) return;
    if (!window.confirm(`この${itemLabel}を削除してもよろしいですか？`)) return;
    setDeleting(true);
    try {
      await onDelete();
    } catch (err) {
      console.error("動画の削除に失敗しました", err);
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

  const handleSave = async (input: VideoInput) => {
    await onSave(input);
    setEditing(false);
  };

  return (
    <div data-video-id={video.id} className="flex min-w-0 scroll-my-20 flex-col rounded-2xl border border-gray-200/70 bg-white p-3 shadow-sm sm:p-4">
      {embed && <YouTubeEmbed video={embed} onPlay={onPlay} />}

      <div className="mt-2.5 flex items-start gap-2.5">
        <ChannelAvatar name={video.channelName} iconUrl={video.channelIconUrl} className="mt-0.5 h-8 w-8" />
        <div className="min-w-0 flex-1">
          {video.title && <p className="line-clamp-2 text-sm font-semibold leading-snug text-gray-900">{video.title}</p>}
          <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="truncate text-xs text-gray-500">{video.channelName || "アカウント名なし"}</span>
            <span className="inline-flex shrink-0 items-center rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-semibold text-gray-500">
              {categoryName}
            </span>
          </div>
        </div>
        {!editing && (
          <div className="flex shrink-0 items-center gap-0.5">
            <button
              type="button"
              onClick={handleTogglePin}
              className={`flex h-7 w-7 items-center justify-center rounded-full transition-colors hover:bg-gray-100 ${
                video.pinned ? "text-amber-500 hover:text-amber-600" : "text-gray-400 hover:text-gray-700"
              }`}
              aria-label={video.pinned ? "ピン留めを外す" : "ピン留め"}
              aria-pressed={video.pinned}
            >
              <Pin className={`h-3.5 w-3.5 ${video.pinned ? "fill-current" : ""}`} strokeWidth={2} />
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

      {!editing && video.memo && <NoteText text={video.memo} className="mt-2 text-sm text-gray-700" />}

      <InlineAccordion open={editing}>
        <VideoInlineForm
          active={editing}
          initialVideo={video}
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
