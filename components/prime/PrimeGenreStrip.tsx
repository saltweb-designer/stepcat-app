"use client";

import { PRIME_GENRES, type PrimeGenre } from "@/lib/prime-genres";

/**
 * アマプラの大カテゴリを、動画ページのチャンネルと同じ丸いアイコンで横に並べる。
 * タップで絞り込み、もう一度タップで解除
 */
export default function PrimeGenreStrip({
  selected,
  onSelect,
}: {
  selected: PrimeGenre | null;
  onSelect: (genre: PrimeGenre | null) => void;
}) {
  return (
    <div className="-mx-4 flex gap-2 overflow-x-auto px-4 py-1 sm:gap-3 [scrollbar-width:none] sm:-mx-6 sm:px-6 [&::-webkit-scrollbar]:hidden">
      {PRIME_GENRES.map(({ id, label, icon: Icon }) => {
        const active = selected === id;
        return (
          <button
            key={id}
            type="button"
            onClick={() => onSelect(active ? null : id)}
            aria-pressed={active}
            className={`flex w-[3.25rem] shrink-0 flex-col items-center gap-1 transition-opacity sm:w-[3.75rem] ${
              selected && !active ? "opacity-40 hover:opacity-70" : ""
            }`}
          >
            <span
              className={`flex h-10 w-10 items-center justify-center rounded-full bg-gray-800 text-white sm:h-12 sm:w-12 ${
                active ? "ring-2 ring-black ring-offset-2 ring-offset-gray-100" : ""
              }`}
            >
              <Icon className="h-[18px] w-[18px] sm:h-5 sm:w-5" strokeWidth={2} />
            </span>
            <span className={`w-full truncate text-center text-[9px] ${active ? "font-bold text-gray-900" : "font-medium text-gray-600"}`}>
              {label}
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
