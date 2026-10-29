"use client";

import { useState } from "react";
import ChannelAvatar from "./ChannelAvatar";

/** スマホで最初に表示するチャンネル数。残りは「続き」で表示する */
const MOBILE_VISIBLE_COUNT = 4;

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
  const [expanded, setExpanded] = useState(false);
  // 選択中のチャンネルが隠れる位置にあるときは開いた状態にする
  const selectedIndex = channels.findIndex((channel) => channel.key === selected);
  const showAll = expanded || selectedIndex >= MOBILE_VISIBLE_COUNT;
  const hiddenCount = channels.length - MOBILE_VISIBLE_COUNT;

  return (
    <div className="-mx-4 flex flex-wrap gap-x-3 gap-y-2 px-4 py-1 [scrollbar-width:none] sm:-mx-6 sm:flex-nowrap sm:gap-3 sm:overflow-x-auto sm:px-6 [&::-webkit-scrollbar]:hidden">
      {channels.map((channel, index) => {
        const active = selected === channel.key;
        const hiddenOnMobile = !showAll && index >= MOBILE_VISIBLE_COUNT;
        return (
          <button
            key={channel.key}
            type="button"
            onClick={() => onSelect(active ? null : channel.key)}
            aria-pressed={active}
            title={channel.name}
            className={`flex w-[3.25rem] shrink-0 flex-col items-center gap-1 transition-opacity sm:w-[3.75rem] ${
              hiddenOnMobile ? "max-sm:hidden" : ""
            } ${selected && !active ? "opacity-40 hover:opacity-70" : ""}`}
          >
            <ChannelAvatar
              name={channel.name}
              iconUrl={channel.iconUrl}
              className={`h-10 w-10 sm:h-12 sm:w-12 ${active ? "ring-2 ring-black ring-offset-2 ring-offset-gray-100" : ""}`}
            />
            <span className={`w-full truncate text-center text-[9px] ${active ? "font-bold text-gray-900" : "font-medium text-gray-600"}`}>
              {channel.name}
            </span>
          </button>
        );
      })}
      {hiddenCount > 0 && selectedIndex < MOBILE_VISIBLE_COUNT && (
        <button
          type="button"
          onClick={() => setExpanded((value) => !value)}
          aria-expanded={showAll}
          className="flex h-10 shrink-0 items-center px-1 text-xs font-semibold text-blue-600 hover:text-blue-700 sm:hidden"
        >
          {showAll ? "閉じる" : `続き（${hiddenCount}）`}
        </button>
      )}
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
