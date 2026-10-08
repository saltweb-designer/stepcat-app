"use client";

import { useState } from "react";
import Image from "next/image";
import { getFaviconUrl } from "@/lib/app-links";

/** 関連アプリのアイコン。登録済み画像 → ファビコン → 頭文字 の順にフォールバックする */
export default function AppIcon({
  name,
  href,
  iconSrc,
  localIcon = false,
}: {
  name: string;
  href: string;
  iconSrc: string;
  /** public/ 配下の同梱アイコンかどうか（next/image で最適化する） */
  localIcon?: boolean;
}) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);

  if (localIcon) {
    return <Image src={iconSrc} alt="" fill sizes="(min-width: 640px) 44px, 72px" className="object-cover" />;
  }

  const candidates = [iconSrc, getFaviconUrl(href)].filter(Boolean);
  const failedIndex = failedSrc ? candidates.indexOf(failedSrc) : -1;
  const src = candidates[failedIndex + 1];
  const isFavicon = src !== undefined && src !== iconSrc;

  if (!src) {
    return (
      <span className="flex h-full w-full items-center justify-center bg-gray-800 text-xl font-bold text-white sm:text-base">
        {name.trim().charAt(0).toUpperCase() || "?"}
      </span>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element -- ユーザーが登録した任意ドメインの画像のため最適化対象外
    <img
      src={src}
      alt=""
      onError={() => setFailedSrc(src)}
      className={`absolute inset-0 h-full w-full ${isFavicon ? "bg-white object-contain p-[20%]" : "object-cover"}`}
    />
  );
}
