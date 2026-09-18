"use client";

import { Tags } from "lucide-react";
import { UNCATEGORIZED_ID } from "@/lib/notes";
import type { NoteCategoryDoc } from "@/lib/types";

export const ALL_CATEGORIES = "__all__";

export default function NoteCategoryFilter({
  categories,
  selected,
  onSelect,
  onManage,
}: {
  categories: NoteCategoryDoc[];
  selected: string;
  onSelect: (value: string) => void;
  onManage: () => void;
}) {
  const chipClass = (active: boolean) =>
    `shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
      active ? "bg-black text-white" : "bg-white text-gray-500 shadow-sm hover:bg-gray-50"
    }`;

  return (
    <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5">
      <button type="button" onClick={() => onSelect(ALL_CATEGORIES)} className={chipClass(selected === ALL_CATEGORIES)}>
        すべて
      </button>
      {categories.map((category) => (
        <button
          key={category.id}
          type="button"
          onClick={() => onSelect(category.id)}
          className={chipClass(selected === category.id)}
        >
          {category.name}
        </button>
      ))}
      <button
        type="button"
        onClick={() => onSelect(UNCATEGORIZED_ID)}
        className={chipClass(selected === UNCATEGORIZED_ID)}
      >
        未分類
      </button>
      <button
        type="button"
        onClick={onManage}
        aria-label="カテゴリを管理"
        title="カテゴリを管理"
        className="ml-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-white hover:text-gray-700"
      >
        <Tags className="h-3.5 w-3.5" strokeWidth={2} />
      </button>
    </div>
  );
}
