"use client";

import { useState } from "react";
import Image from "next/image";
import { Pencil, Trash2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useMonthGoal } from "@/hooks/useMonthGoal";

export default function MonthGoalCard({ monthKey, monthLabel }: { monthKey: string; monthLabel: string }) {
  const { user } = useAuth();
  const { text, loading, error, saveGoal, deleteGoal } = useMonthGoal(user?.uid, monthKey);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const startEditing = () => {
    setDraft(text);
    setEditing(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await saveGoal(draft.trim());
      setEditing(false);
    } catch (err) {
      console.error("月の目標の保存に失敗しました", err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deleteGoal();
      setEditing(false);
    } catch (err) {
      console.error("月の目標の削除に失敗しました", err);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <section className="relative overflow-hidden rounded-2xl bg-[#565741] p-4 text-white shadow-sm sm:p-5">
      <div className="relative z-10 pr-16 sm:pr-20">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-sm font-bold text-white">{monthLabel}の目標</h2>
          {!editing && (
            <div className="flex items-center gap-1">
              {text && (
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={deleting}
                  className="flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-semibold text-white/70 transition-colors hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Trash2 className="h-3 w-3" strokeWidth={2} />
                  削除
                </button>
              )}
              <button
                type="button"
                onClick={startEditing}
                className="flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-semibold text-white/70 transition-colors hover:bg-white/10 hover:text-white"
              >
                <Pencil className="h-3 w-3" strokeWidth={2} />
                {text ? "編集" : "登録"}
              </button>
            </div>
          )}
        </div>

        {editing ? (
          <div className="mt-2 flex flex-col gap-2">
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              rows={3}
              autoFocus
              placeholder="今月の大きな目標やテーマを入力..."
              className="w-full resize-none rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-base text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-white/40"
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
        ) : error ? (
          <p className="mt-1 text-sm font-semibold text-rose-300">{error}</p>
        ) : (
          <p className="mt-1 whitespace-pre-wrap break-words text-sm font-semibold text-white">
            {text || "この月の目標はまだ登録されていません"}
          </p>
        )}
      </div>

      <div className="pointer-events-none absolute -bottom-2 -right-2 h-16 w-20 sm:h-20 sm:w-24">
        <Image src="/home_ai.png" alt="" fill sizes="96px" className="object-contain object-bottom" />
      </div>
    </section>
  );
}
