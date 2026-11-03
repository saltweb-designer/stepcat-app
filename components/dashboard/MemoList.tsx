"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import EntryActions from "@/components/entry-form/EntryActions";
import EntryFormModal from "@/components/entry-form/EntryFormModal";
import type { EntryDoc } from "@/lib/types";

export default function MemoList({ memos, date }: { memos: EntryDoc[]; date: string }) {
  const [adding, setAdding] = useState(false);

  return (
    <>
      {memos.length === 0 ? (
        <button
          type="button"
          onClick={() => setAdding(true)}
          className="min-w-0 flex-1 text-left text-sm text-gray-400 transition-colors hover:text-gray-600"
        >
          まだメモがありません
          <span className="ml-1.5 text-xs text-gray-300">タップして追加</span>
        </button>
      ) : (
        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
          {memos.map((memo) => (
            <div
              key={memo.id}
              className="flex items-start justify-between gap-2 rounded-lg border border-gray-200/70 bg-white px-2.5 py-2"
            >
              <p className="min-w-0 flex-1 whitespace-pre-wrap break-words text-sm leading-relaxed text-gray-600">
                {memo.detail || memo.title}
              </p>
              <EntryActions entry={memo} date={date} />
            </div>
          ))}
          <button
            type="button"
            onClick={() => setAdding(true)}
            className="flex items-center gap-1 self-start rounded-full px-1.5 py-0.5 text-xs font-medium text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
          >
            <Plus className="h-3.5 w-3.5" strokeWidth={2.5} />
            メモを追加
          </button>
        </div>
      )}

      {adding && (
        <EntryFormModal initialDate={date} initialCategory="memo" onClose={() => setAdding(false)} />
      )}
    </>
  );
}
