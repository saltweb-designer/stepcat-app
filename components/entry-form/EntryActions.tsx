"use client";

import { useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
import EntryFormModal from "./EntryFormModal";
import { useDeleteEntry } from "@/hooks/useDeleteEntry";
import type { EntryDoc } from "@/lib/types";

export default function EntryActions({
  entry,
  className = "flex shrink-0 items-center gap-0.5",
}: {
  entry: EntryDoc;
  className?: string;
}) {
  const [editing, setEditing] = useState(false);
  const deleteEntry = useDeleteEntry();

  return (
    <>
      <div className={className}>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setEditing(true);
          }}
          className="flex h-6 w-6 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700"
          aria-label="編集"
        >
          <Pencil className="h-3.5 w-3.5" strokeWidth={2} />
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            deleteEntry(entry.id);
          }}
          className="flex h-6 w-6 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-rose-50 hover:text-rose-500"
          aria-label="削除"
        >
          <Trash2 className="h-3.5 w-3.5" strokeWidth={2} />
        </button>
      </div>

      {editing && <EntryFormModal initialEntry={entry} onClose={() => setEditing(false)} />}
    </>
  );
}
