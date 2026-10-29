"use client";

import ChannelAvatar from "./ChannelAvatar";

export interface ChannelSummary {
  /** チャンネルを識別するキー（チャンネルURL、無ければチャンネル名） */
  key: string;
  name: string;
  iconUrl: string;
}

/** 登録済みのチャンネルをアイコンで横並びに表示する。タップで絞り込み、もう一度タップで解除 */
export default function ChannelStrip({
  channels,
  selected,
  onSelect,
}: {
  channels: ChannelSummary[];
  selected: string | null;
  onSelect: (key: string | null) => void;
}) {
  return (
    <div className="-mx-4 flex gap-3 overflow-x-auto px-4 py-1 [scrollbar-width:none] sm:-mx-6 sm:px-6 [&::-webkit-scrollbar]:hidden">
      {channels.map((channel) => {
        const active = selected === channel.key;
        return (
          <button
            key={channel.key}
            type="button"
            onClick={() => onSelect(active ? null : channel.key)}
            aria-pressed={active}
            title={channel.name}
            className={`flex w-[3.25rem] shrink-0 flex-col items-center gap-1 transition-opacity sm:w-[3.75rem] ${
              selected && !active ? "opacity-40 hover:opacity-70" : ""
            }`}
          >
            <ChannelAvatar
              name={channel.name}
              iconUrl={channel.iconUrl}
              className={`h-10 w-10 sm:h-12 sm:w-12 ${active ? "ring-2 ring-black ring-offset-2 ring-offset-gray-100" : ""}`}
            />
            <span className={`w-full truncate text-center text-[10px] ${active ? "font-bold text-gray-900" : "font-medium text-gray-600"}`}>
              {channel.name}
            </span>
          </button>
        );
      })}
      {selected && (
        <button
          type="button"
          onClick={() => onSelect(null)}
          className="flex h-10 shrink-0 items-center px-1 text-xs font-semibold text-blue-600 hover:text-blue-700 sm:h-12"
        >
          すべて
        </button>
      )}
    </div>
  );
}
