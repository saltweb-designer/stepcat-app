"use client";

import { useRef, useState, type PointerEvent } from "react";
import ChannelAvatar from "./ChannelAvatar";

/** スマホ・iPad（タッチ操作の端末）で最初に表示するチャンネル数。残りは「続き」で表示する */
const MOBILE_VISIBLE_COUNT = 4;

/** これ以上指が動いたらタップではなくドラッグとみなす（px） */
const DRAG_THRESHOLD = 6;

const textButtonClassName = "h-10 shrink-0 items-center px-1 text-xs font-semibold sm:h-12";

export interface ChannelSummary {
  /** チャンネルを識別するキー（チャンネルURL、無ければチャンネル名） */
  key: string;
  name: string;
  iconUrl: string;
}

/**
 * 登録済みのチャンネルをアイコンで横並びに表示する。タップで絞り込み、もう一度タップで解除。
 * 「並び替え」を押すと全チャンネルを折り返して表示し、ドラッグで順番を入れ替えられる
 */
export default function ChannelStrip({
  channels,
  selected,
  onSelect,
  onReorder,
}: {
  channels: ChannelSummary[];
  selected: string | null;
  onSelect: (key: string | null) => void;
  onReorder: (keys: string[]) => Promise<void>;
}) {
  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing] = useState(false);
  /** ドラッグ中の並び順（キーの配列）。ドラッグしていないときは null */
  const [draftOrder, setDraftOrder] = useState<string[] | null>(null);
  const [draggingKey, setDraggingKey] = useState<string | null>(null);
  const dragRef = useRef<{ key: string; x: number; y: number; moved: boolean } | null>(null);

  // 選択中のチャンネルが隠れる位置にあるときは開いた状態にする
  const selectedIndex = channels.findIndex((channel) => channel.key === selected);
  const showAll = expanded || selectedIndex >= MOBILE_VISIBLE_COUNT;
  const hiddenCount = channels.length - MOBILE_VISIBLE_COUNT;

  const displayedChannels = draftOrder
    ? draftOrder.flatMap((key) => channels.find((channel) => channel.key === key) ?? [])
    : channels;

  const handlePointerDown = (e: PointerEvent<HTMLButtonElement>, key: string) => {
    if (e.button !== 0) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    dragRef.current = { key, x: e.clientX, y: e.clientY, moved: false };
  };

  const handlePointerMove = (e: PointerEvent<HTMLButtonElement>) => {
    const drag = dragRef.current;
    if (!drag) return;
    if (!drag.moved) {
      if (Math.hypot(e.clientX - drag.x, e.clientY - drag.y) < DRAG_THRESHOLD) return;
      drag.moved = true;
      setDraggingKey(drag.key);
      setDraftOrder(channels.map((channel) => channel.key));
    }
    const target = document
      .elementFromPoint(e.clientX, e.clientY)
      ?.closest<HTMLElement>("[data-channel-key]")?.dataset.channelKey;
    if (!target || target === drag.key) return;
    setDraftOrder((prev) => {
      if (!prev) return prev;
      const next = prev.filter((key) => key !== drag.key);
      next.splice(prev.indexOf(target), 0, drag.key);
      return next;
    });
  };

  const handlePointerEnd = async () => {
    const drag = dragRef.current;
    dragRef.current = null;
    if (!drag?.moved) return;
    setDraggingKey(null);
    const order = draftOrder;
    try {
      if (order && order.some((key, i) => key !== channels[i]?.key)) await onReorder(order);
    } catch (err) {
      console.error("チャンネルの並び替えに失敗しました", err);
    } finally {
      setDraftOrder(null);
    }
  };

  if (editing) {
    return (
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <p className="text-xs text-gray-400">ドラッグで並び替え</p>
          <button
            type="button"
            onClick={() => setEditing(false)}
            className="rounded-full px-2.5 py-1 text-xs font-semibold text-blue-600 hover:text-blue-700"
          >
            完了
          </button>
        </div>
        <div className="flex flex-wrap gap-x-3 gap-y-2 py-1">
          {displayedChannels.map((channel) => (
            <button
              key={channel.key}
              type="button"
              data-channel-key={channel.key}
              onPointerDown={(e) => handlePointerDown(e, channel.key)}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerEnd}
              onPointerCancel={handlePointerEnd}
              aria-label={`${channel.name}をドラッグして並び替え`}
              className={`flex w-[3.25rem] shrink-0 touch-none select-none flex-col items-center gap-1 transition-transform sm:w-[3.75rem] ${
                draggingKey === channel.key ? "z-10 scale-110 opacity-80" : ""
              }`}
            >
              <ChannelAvatar
                name={channel.name}
                iconUrl={channel.iconUrl}
                className="pointer-events-none h-10 w-10 ring-2 ring-black/80 ring-offset-2 ring-offset-gray-100 sm:h-12 sm:w-12"
              />
              <span className="pointer-events-none w-full truncate text-center text-[9px] font-medium text-gray-600">
                {channel.name}
              </span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="-mx-4 flex gap-3 overflow-x-auto px-4 py-1 [scrollbar-width:none] sm:-mx-6 sm:px-6 [&::-webkit-scrollbar]:hidden">
      {channels.map((channel, index) => {
        const active = selected === channel.key;
        const hiddenOnTouch = !showAll && index >= MOBILE_VISIBLE_COUNT;
        return (
          <button
            key={channel.key}
            type="button"
            onClick={() => onSelect(active ? null : channel.key)}
            aria-pressed={active}
            title={channel.name}
            className={`flex w-[3.25rem] shrink-0 flex-col items-center gap-1 transition-opacity sm:w-[3.75rem] ${
              hiddenOnTouch ? "max-sm:hidden pointer-coarse:hidden" : ""
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
          className={`${textButtonClassName} hidden text-blue-600 hover:text-blue-700 max-sm:flex pointer-coarse:flex`}
        >
          {showAll ? "閉じる" : `続き（${hiddenCount}）`}
        </button>
      )}
      {selected && (
        <button
          type="button"
          onClick={() => onSelect(null)}
          className={`${textButtonClassName} flex text-blue-600 hover:text-blue-700`}
        >
          すべて
        </button>
      )}
      {channels.length > 1 && (
        // スマホ・iPad では「続き」で全部を開いたときだけ出して、閉じているときの行を詰めすぎないようにする
        <button
          type="button"
          onClick={() => setEditing(true)}
          className={`${textButtonClassName} flex text-gray-500 hover:text-gray-700 ${
            showAll || hiddenCount <= 0 ? "" : "max-sm:hidden pointer-coarse:hidden"
          }`}
        >
          並び替え
        </button>
      )}
    </div>
  );
}
