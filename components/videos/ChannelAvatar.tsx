"use client";

import { useState } from "react";

/** チャンネルのアイコン。画像が無い・読み込めない場合はチャンネル名の頭文字を表示する */
export default function ChannelAvatar({
  name,
  iconUrl,
  className = "",
}: {
  name: string;
  iconUrl: string;
  className?: string;
}) {
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  const showImage = iconUrl !== "" && failedUrl !== iconUrl;

  return (
    <span className={`relative block shrink-0 overflow-hidden rounded-full bg-gray-800 ${className}`}>
      {showImage ? (
        // eslint-disable-next-line @next/next/no-img-element -- YouTube のアイコン配信ドメインが複数あるため最適化対象外
        <img
          src={iconUrl}
          alt=""
          referrerPolicy="no-referrer"
          onError={() => setFailedUrl(iconUrl)}
          className="absolute inset-0 h-full w-full object-cover"
        />
      ) : (
        <span className="flex h-full w-full items-center justify-center text-sm font-bold text-white">
          {name.trim().charAt(0).toUpperCase() || "?"}
        </span>
      )}
    </span>
  );
}
