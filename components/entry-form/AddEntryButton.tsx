"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import EntryFormModal from "./EntryFormModal";

export default function AddEntryButton({
  variant = "default",
  initialDate,
}: {
  variant?: "default" | "compact" | "bar";
  initialDate?: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      {variant === "bar" ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex w-full items-center justify-center gap-2 bg-black px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-gray-800"
        >
          <Plus className="h-4 w-4 shrink-0" strokeWidth={2.5} />
          新規追加
        </button>
      ) : variant === "compact" ? (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="flex items-center gap-1.5 rounded-full bg-black px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-gray-800"
          >
            <Plus className="h-3.5 w-3.5" strokeWidth={2.5} />
            新規追加
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-black px-4 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:-translate-y-0.5 hover:bg-gray-800 hover:shadow-md"
        >
          <Plus className="h-4 w-4" strokeWidth={2.5} />
          新規追加
        </button>
      )}

      {open && <EntryFormModal initialDate={initialDate} onClose={() => setOpen(false)} />}
    </>
  );
}
