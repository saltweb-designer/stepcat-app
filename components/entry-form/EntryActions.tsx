"use client";

import { useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
import EntryFormModal from "./EntryFormModal";
import EditScopeDialog from "./EditScopeDialog";
import { useDeleteEntry } from "@/hooks/useDeleteEntry";
import { isSeriesEntry, type EditScope } from "@/lib/recurrence";
import type { EntryDoc } from "@/lib/types";

export default function EntryActions({
  entry,
  date,
  className = "flex shrink-0 items-center gap-0.5",
}: {
  entry: EntryDoc;
  /** 表示中の日付。期間・曜日指定のエントリの場合、「この日のみ」等の範囲指定に使う */
  date?: string;
  className?: string;
}) {
  const [editScope, setEditScope] = useState<EditScope | null>(null);
  const [scopeDialog, setScopeDialog] = useState<"edit" | "delete" | null>(null);
  const deleteEntry = useDeleteEntry();
  const askScope = !!date && isSeriesEntry(entry);

  const handleEdit = () => {
    if (askScope) setScopeDialog("edit");
    else setEditScope("all");
  };

  const handleDelete = () => {
    if (askScope) {
      setScopeDialog("delete");
      return;
    }
    if (window.confirm("この予定を削除してもよろしいですか？")) deleteEntry(entry);
  };

  const handleSelectScope = (scope: EditScope) => {
    const mode = scopeDialog;
    setScopeDialog(null);
    if (mode === "edit") setEditScope(scope);
    else if (mode === "delete") deleteEntry(entry, scope, date);
  };

  return (
    <>
      <div className={className}>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            handleEdit();
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
            handleDelete();
          }}
          className="flex h-6 w-6 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-rose-50 hover:text-rose-500"
          aria-label="削除"
        >
          <Trash2 className="h-3.5 w-3.5" strokeWidth={2} />
        </button>
      </div>

      {scopeDialog && date && (
        <EditScopeDialog
          mode={scopeDialog}
          date={date}
          onSelect={handleSelectScope}
          onClose={() => setScopeDialog(null)}
        />
      )}

      {editScope && (
        <EntryFormModal
          initialEntry={entry}
          scope={editScope}
          occurrenceDate={date}
          onClose={() => setEditScope(null)}
        />
      )}
    </>
  );
}
