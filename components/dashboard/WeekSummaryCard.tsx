"use client";

import { useState } from "react";
import { Pencil } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useWeekSummary } from "@/hooks/useWeekSummary";

export default function WeekSummaryCard({
  weekStartDate,
  compact = false,
  plain = false,
  rangeLabel,
}: {
  weekStartDate: string;
  /** true のときは見出しと内側のボックスを省き、親のボックスにそのまま本文を並べる（ホーム用） */
  compact?: boolean;
  /** true のときは暗いボックスで囲わず、白い背景に見出しと本文を並べる（予定ページのアコーディオン用） */
  plain?: boolean;
  /** plain のとき見出しのあとに赤字で添える週の期間（例: 9/28〜10/4） */
  rangeLabel?: string;
}) {
  const { user } = useAuth();
  const { text, loading, error, saveSummary } = useWeekSummary(user?.uid, weekStartDate);
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

  const editButton = (
    <button
      type="button"
      onClick={startEditing}
      aria-label={compact ? "今週の概要を編集" : undefined}
      className={`flex shrink-0 items-center gap-1 rounded-full text-[11px] font-semibold transition-colors ${
        plain
          ? "border border-gray-200 bg-white text-gray-500 hover:bg-gray-50 hover:text-gray-900"
          : "text-white/70 hover:bg-white/10 hover:text-white"
      } ${
        compact ? "-mr-1 h-6 w-6 justify-center" : "px-2 py-1"
      }`}
    >
      <Pencil className="h-3 w-3" strokeWidth={2} />
      {!compact && "編集"}
    </button>
  );

  const body = editing ? (
    <div className="mt-2 flex flex-col gap-2">
      <textarea
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        rows={plain ? 6 : 3}
        autoFocus
        placeholder="今週の目標や意気込みを入力..."
        className={`w-full rounded-lg border px-3 py-2 text-base focus:outline-none focus:ring-2 ${
          plain
            ? "resize-y border-gray-200 bg-white text-gray-900 placeholder-gray-400 focus:ring-gray-300"
            : "resize-none border-white/20 bg-white/10 text-white placeholder-white/40 focus:ring-white/40"
        }`}
      />
      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={() => setEditing(false)}
          className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
            plain ? "text-gray-500 hover:bg-gray-200" : "text-white/70 hover:bg-white/10"
          }`}
        >
          キャンセル
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className={`rounded-full px-4 py-1.5 text-xs font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
            plain ? "bg-gray-900 text-white hover:bg-gray-700" : "bg-white text-gray-900 hover:bg-gray-100"
          }`}
        >
          {saving ? "保存中..." : "保存"}
        </button>
      </div>
    </div>
  ) : loading ? (
    <div className={`mt-2 h-4 w-2/3 animate-pulse rounded ${plain ? "bg-gray-200" : "bg-white/10"}`} />
  ) : error ? (
    <p className={`mt-1 text-sm font-semibold ${plain ? "text-rose-500" : "text-rose-300"}`}>{error}</p>
  ) : plain ? (
    <p className={`mt-1 whitespace-pre-wrap text-sm leading-relaxed ${text ? "text-gray-800" : "text-gray-400"}`}>
      {text || "今週の概要はまだ入力されていません"}
    </p>
  ) : (
    <p className="mt-1 min-w-0 flex-1 whitespace-pre-wrap text-sm font-semibold text-white">
      {text || "今週の概要はまだ入力されていません"}
    </p>
  );

  if (plain) {
    return (
      <div className="flex flex-col">
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs font-semibold text-gray-500">
            今週の概要
            {rangeLabel && (
              <>
                （<span className="font-bold text-red-500">{rangeLabel}</span>）
              </>
            )}
          </p>
          {!editing && editButton}
        </div>
        {body}
      </div>
    );
  }

  if (compact) {
    return editing || loading || error ? (
      body
    ) : (
      <div className="flex items-start gap-1">
        {body}
        {editButton}
      </div>
    );
  }

  return (
    <div className="mt-3 rounded-xl bg-white/10 px-4 py-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-bold uppercase tracking-wide text-white/70">今週の概要</p>
        {!editing && editButton}
      </div>
      {body}
    </div>
  );
}
