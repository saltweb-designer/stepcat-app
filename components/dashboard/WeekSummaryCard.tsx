"use client";

import { useState } from "react";
import { Pencil } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useWeekSummary } from "@/hooks/useWeekSummary";

export default function WeekSummaryCard({ weekStartDate }: { weekStartDate: string }) {
  const { user } = useAuth();
  const { text, loading, saveSummary } = useWeekSummary(user?.uid, weekStartDate);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const [saving, setSaving] = useState(false);

  const startEditing = () => {
    setDraft(text);
    setEditing(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await saveSummary(draft.trim());
      setEditing(false);
    } catch (error) {
      console.error("今週の概要の保存に失敗しました", error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mt-3 rounded-xl bg-white/10 px-4 py-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-bold uppercase tracking-wide text-white/70">今週の概要</p>
        {!editing && (
          <button
            type="button"
            onClick={startEditing}
            className="flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-semibold text-white/70 transition-colors hover:bg-white/10 hover:text-white"
          >
            <Pencil className="h-3 w-3" strokeWidth={2} />
            編集
          </button>
        )}
      </div>

      {editing ? (
        <div className="mt-2 flex flex-col gap-2">
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            rows={3}
            autoFocus
            placeholder="今週の目標や意気込みを入力..."
            className="w-full resize-none rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-sm text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-white/40"
          />
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="rounded-full px-3 py-1.5 text-xs font-medium text-white/70 transition-colors hover:bg-white/10"
            >
              キャンセル
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="rounded-full bg-white px-4 py-1.5 text-xs font-semibold text-gray-900 transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? "保存中..." : "保存"}
            </button>
          </div>
        </div>
      ) : loading ? (
        <div className="mt-2 h-4 w-2/3 animate-pulse rounded bg-white/10" />
      ) : (
        <p className="mt-1 whitespace-pre-wrap text-sm font-semibold text-white">
          {text || "今週の概要はまだ入力されていません"}
        </p>
      )}
    </div>
  );
}
