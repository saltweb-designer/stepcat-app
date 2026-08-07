"use client";

import { useEffect, useState, type FormEvent } from "react";
import { CalendarRange, CheckSquare, Link2, NotebookText, X } from "lucide-react";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";
import type { EntryCategory } from "@/lib/types";

const categories: { value: EntryCategory; label: string; icon: typeof CalendarRange }[] = [
  { value: "schedule", label: "スケジュール", icon: CalendarRange },
  { value: "task", label: "タスク", icon: CheckSquare },
  { value: "memo", label: "メモ", icon: NotebookText },
  { value: "link", label: "リンク", icon: Link2 },
];

export default function EntryFormModal({ onClose }: { onClose: () => void }) {
  const { user } = useAuth();
  const [category, setCategory] = useState<EntryCategory>("schedule");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [allDay, setAllDay] = useState(true);
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [title, setTitle] = useState("");
  const [detail, setDetail] = useState("");
  const [link, setLink] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const trimmedTitle = title.trim();
    if (!trimmedTitle || !user || saving) return;

    setSaving(true);
    setError(null);
    try {
      const resolvedStartDate = startDate || new Date().toISOString().slice(0, 10);
      const resolvedEndDate = endDate || resolvedStartDate;
      await addDoc(collection(db, "users", user.uid, "entries"), {
        category,
        title: trimmedTitle,
        detail: detail.trim(),
        link: link.trim(),
        startDate: resolvedStartDate,
        endDate: resolvedEndDate,
        allDay,
        startTime: allDay ? "" : startTime,
        endTime: allDay ? "" : endTime,
        done: false,
        createdAt: serverTimestamp(),
      });
      onClose();
    } catch (err) {
      console.error("保存に失敗しました", err);
      setError("保存に失敗しました。もう一度お試しください。");
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm p-0 sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="entry-form-title"
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[90vh] w-full flex-col overflow-hidden rounded-t-2xl bg-white shadow-2xl sm:max-w-lg sm:rounded-2xl"
      >
        <header className="flex shrink-0 items-center justify-between border-b border-gray-100 px-5 py-4">
          <h2 id="entry-form-title" className="text-base font-semibold text-gray-900">
            予定・タスクを追加
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
            aria-label="閉じる"
          >
            <X className="h-5 w-5" strokeWidth={2} />
          </button>
        </header>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-5 py-4">
          <div className="flex flex-col gap-5">
            <div>
              <label className="mb-2 block text-xs font-semibold text-gray-500">カテゴリ</label>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {categories.map(({ value, label, icon: Icon }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setCategory(value)}
                    aria-pressed={category === value}
                    className={`flex flex-col items-center gap-1 rounded-xl border px-2 py-2.5 text-xs font-medium transition-colors ${
                      category === value
                        ? "border-black bg-gray-100 text-gray-900"
                        : "border-gray-200 text-gray-500 hover:border-gray-300"
                    }`}
                  >
                    <Icon className="h-4 w-4" strokeWidth={2} />
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="mb-2 block text-xs font-semibold text-gray-500">期間</label>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label htmlFor="entry-start-date" className="mb-1 block text-[11px] text-gray-400">
                    開始日
                  </label>
                  <input
                    id="entry-start-date"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-black/20"
                  />
                </div>
                <div>
                  <label htmlFor="entry-end-date" className="mb-1 block text-[11px] text-gray-400">
                    終了日
                  </label>
                  <input
                    id="entry-end-date"
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-black/20"
                  />
                </div>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between">
                <label htmlFor="entry-all-day" className="text-xs font-semibold text-gray-500">
                  終日
                </label>
                <button
                  id="entry-all-day"
                  type="button"
                  role="switch"
                  aria-checked={allDay}
                  onClick={() => setAllDay((v) => !v)}
                  className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
                    allDay ? "bg-black" : "bg-gray-300"
                  }`}
                >
                  <span
                    className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                      allDay ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>

              {!allDay && (
                <div className="mt-2 grid grid-cols-2 gap-2">
                  <div>
                    <label htmlFor="entry-start-time" className="mb-1 block text-[11px] text-gray-400">
                      開始時間
                    </label>
                    <input
                      id="entry-start-time"
                      type="time"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-black/20"
                    />
                  </div>
                  <div>
                    <label htmlFor="entry-end-time" className="mb-1 block text-[11px] text-gray-400">
                      終了時間
                    </label>
                    <input
                      id="entry-end-time"
                      type="time"
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-black/20"
                    />
                  </div>
                </div>
              )}
            </div>

            <div>
              <label htmlFor="entry-title" className="mb-1.5 block text-xs font-semibold text-gray-500">
                タイトル
              </label>
              <input
                id="entry-title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="例：プロジェクト企画書 提出期限"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-black/20"
              />
            </div>

            <div>
              <label htmlFor="entry-detail" className="mb-1.5 block text-xs font-semibold text-gray-500">
                詳細・メモ
              </label>
              <textarea
                id="entry-detail"
                value={detail}
                onChange={(e) => setDetail(e.target.value)}
                rows={3}
                placeholder="詳細やメモを入力..."
                className="w-full resize-none rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-black/20"
              />
            </div>

            <div>
              <label htmlFor="entry-link" className="mb-1.5 block text-xs font-semibold text-gray-500">
                リンク（URL / Googleマップ）
              </label>
              <div className="flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 focus-within:ring-2 focus-within:ring-black/20">
                <Link2 className="h-4 w-4 shrink-0 text-gray-400" strokeWidth={2} />
                <input
                  id="entry-link"
                  type="url"
                  value={link}
                  onChange={(e) => setLink(e.target.value)}
                  placeholder="https:// または Googleマップのリンク"
                  className="w-full text-sm text-gray-700 placeholder-gray-400 focus:outline-none"
                />
              </div>
            </div>
          </div>

          <div className="mt-6 flex items-center justify-end gap-2 border-t border-gray-100 pt-4">
            {error && <p className="mr-auto text-xs font-medium text-rose-600">{error}</p>}
            <button
              type="button"
              onClick={onClose}
              className="rounded-full border border-gray-300 px-4 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50"
            >
              キャンセル
            </button>
            <button
              type="submit"
              disabled={title.trim() === "" || saving}
              className="rounded-full bg-black px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-gray-800 disabled:cursor-not-allowed disabled:bg-gray-300"
            >
              {saving ? "保存中..." : "保存"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
