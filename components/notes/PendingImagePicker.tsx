"use client";

import { useRef, type ChangeEvent } from "react";
import { ImagePlus, X } from "lucide-react";

/** 保存前に選んだ画像（プレビュー用の一時 URL 付き） */
export interface PendingImage {
  id: string;
  file: File;
  previewUrl: string;
}

let nextPendingId = 0;

export function toPendingImages(files: File[]): PendingImage[] {
  return files.map((file) => ({
    id: `pending-${nextPendingId++}`,
    file,
    previewUrl: URL.createObjectURL(file),
  }));
}

export function revokePendingImages(images: PendingImage[]) {
  for (const image of images) URL.revokeObjectURL(image.previewUrl);
}

/**
 * まだ保存していない画像を選んでプレビューする。新規ノート作成フォームで使い、
 * 実際の保存はノートを作成した後に呼び出し側で行う。一時 URL の解放（フォームを開き直すとき）も呼び出し側が担う
 */
export default function PendingImagePicker({
  images,
  onChange,
  disabled,
}: {
  images: PendingImage[];
  onChange: (images: PendingImage[]) => void;
  disabled?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    e.target.value = "";
    if (files.length === 0) return;
    onChange([...images, ...toPendingImages(files)]);
  };

  const handleRemove = (target: PendingImage) => {
    revokePendingImages([target]);
    onChange(images.filter((image) => image.id !== target.id));
  };

  return (
    <div>
      {images.length > 0 && (
        <div className="mb-2 grid grid-cols-4 gap-1.5 sm:grid-cols-5">
          {images.map((image) => (
            <div key={image.id} className="relative aspect-square overflow-hidden rounded-lg bg-gray-100">
              {/* eslint-disable-next-line @next/next/no-img-element -- 保存前の一時 URL をそのまま表示する */}
              <img src={image.previewUrl} alt="" className="h-full w-full object-cover" />
              <button
                type="button"
                onClick={() => handleRemove(image)}
                disabled={disabled}
                aria-label="この画像を外す"
                className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white transition-colors hover:bg-black/80 disabled:opacity-60"
              >
                <X className="h-3.5 w-3.5" strokeWidth={2.5} />
              </button>
            </div>
          ))}
        </div>
      )}

      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={disabled}
        className="flex items-center gap-1.5 rounded-full border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-500 transition-colors hover:border-gray-300 hover:text-gray-700 disabled:opacity-60"
      >
        <ImagePlus className="h-3.5 w-3.5" strokeWidth={2} />
        画像を追加
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleChange}
        className="hidden"
      />
    </div>
  );
}
