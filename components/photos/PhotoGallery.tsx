"use client";

import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { ChevronLeft, ChevronRight, ImagePlus, Loader2, Trash2, X } from "lucide-react";

/** ギャラリーに並べる画像。カレンダーの日付画像・ノート画像のどちらでも使う */
export interface GalleryPhoto {
  id: string;
  dataUrl: string;
}

function PhotoViewer({
  photos,
  index,
  onIndexChange,
  onClose,
  onDelete,
}: {
  photos: GalleryPhoto[];
  index: number;
  onIndexChange: (index: number) => void;
  onClose: () => void;
  onDelete: () => void;
}) {
  const photo = photos[index];
  const hasPrev = index > 0;
  const hasNext = index < photos.length - 1;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft" && hasPrev) onIndexChange(index - 1);
      if (e.key === "ArrowRight" && hasNext) onIndexChange(index + 1);
    };
    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [onClose, onIndexChange, index, hasPrev, hasNext]);

  const navButtonClassName =
    "flex items-center gap-1 rounded-full bg-white/15 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-white/25 disabled:opacity-30 disabled:hover:bg-white/15";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
      onClick={onClose}
    >
      <div className="absolute right-3 top-3 flex gap-2">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          aria-label="画像を削除"
          className="flex h-9 w-9 items-center justify-center rounded-full bg-white/15 text-white transition-colors hover:bg-white/25"
        >
          <Trash2 className="h-4 w-4" strokeWidth={2} />
        </button>
        <button
          type="button"
          onClick={onClose}
          aria-label="閉じる"
          className="flex h-9 w-9 items-center justify-center rounded-full bg-white/15 text-white transition-colors hover:bg-white/25"
        >
          <X className="h-5 w-5" strokeWidth={2} />
        </button>
      </div>
      {/* eslint-disable-next-line @next/next/no-img-element -- data URL をそのまま表示する */}
      <img
        src={photo.dataUrl}
        alt=""
        className="max-h-[calc(100%-7rem)] max-w-full rounded-lg object-contain"
        onClick={(e) => e.stopPropagation()}
      />
      {photos.length > 1 && (
        <div
          className="absolute inset-x-0 bottom-6 flex items-center justify-center gap-4"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            onClick={() => onIndexChange(index - 1)}
            disabled={!hasPrev}
            className={navButtonClassName}
          >
            <ChevronLeft className="h-4 w-4" strokeWidth={2.5} />前
          </button>
          <span className="min-w-12 text-center text-sm text-white/80">
            {index + 1} / {photos.length}
          </span>
          <button
            type="button"
            onClick={() => onIndexChange(index + 1)}
            disabled={!hasNext}
            className={navButtonClassName}
          >
            次<ChevronRight className="h-4 w-4" strokeWidth={2.5} />
          </button>
        </div>
      )}
    </div>
  );
}

/** サムネイル一覧＋「画像を追加」ボタン＋拡大表示。保存・削除の処理は呼び出し側から渡す */
export default function PhotoGallery({
  photos,
  onAdd,
  onDelete,
}: {
  photos: GalleryPhoto[];
  onAdd: (files: File[]) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}) {
  const [uploading, setUploading] = useState(false);
  const [viewingId, setViewingId] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const viewingIndex = photos.findIndex((p) => p.id === viewingId);
  const viewing = viewingIndex >= 0 ? photos[viewingIndex] : null;

  const handleChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    e.target.value = "";
    if (files.length === 0) return;
    setUploading(true);
    try {
      await onAdd(files);
    } catch (err) {
      console.error("画像の保存に失敗しました", err);
      window.alert("画像の保存に失敗しました。");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (photo: GalleryPhoto) => {
    if (!window.confirm("この画像を削除してもよろしいですか？")) return;
    setViewingId(null);
    await onDelete(photo.id);
  };

  return (
    <div>
      {photos.length > 0 && (
        <div className="mb-2 grid grid-cols-4 gap-1.5 sm:grid-cols-5">
          {photos.map((photo) => (
            <button
              key={photo.id}
              type="button"
              onClick={() => setViewingId(photo.id)}
              className="aspect-square overflow-hidden rounded-lg bg-gray-100"
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- data URL をそのまま表示する */}
              <img src={photo.dataUrl} alt="" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}

      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        className="flex items-center gap-1.5 rounded-full border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-500 transition-colors hover:border-gray-300 hover:text-gray-700 disabled:opacity-60"
      >
        {uploading ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" strokeWidth={2} />
        ) : (
          <ImagePlus className="h-3.5 w-3.5" strokeWidth={2} />
        )}
        {uploading ? "保存中…" : "画像を追加"}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleChange}
        className="hidden"
      />

      {viewing && (
        <PhotoViewer
          photos={photos}
          index={viewingIndex}
          onIndexChange={(i) => setViewingId(photos[i].id)}
          onClose={() => setViewingId(null)}
          onDelete={() => handleDelete(viewing)}
        />
      )}
    </div>
  );
}
