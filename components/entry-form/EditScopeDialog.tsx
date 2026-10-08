"use client";

import { useEffect } from "react";
import { CalendarDays, CalendarRange, CalendarArrowDown, X } from "lucide-react";
import type { EditScope } from "@/lib/recurrence";

function formatDate(iso: string) {
  const [, m, d] = iso.split("-");
  return `${Number(m)}/${Number(d)}`;
}

/** 期間・曜日指定のエントリを編集／削除するときに、反映範囲を選ばせるダイアログ */
export default function EditScopeDialog({
  mode,
  date,
  onSelect,
  onClose,
}: {
  mode: "edit" | "delete";
  date: string;
  onSelect: (scope: EditScope) => void;
  onClose: () => void;
}) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const isDelete = mode === "delete";
  const verb = isDelete ? "削除" : "編集";
  const options: { scope: EditScope; label: string; description: string; icon: typeof CalendarDays }[] = [
    {
      scope: "single",
      label: `この日のみ（${formatDate(date)}）`,
      description: isDelete ? "この日だけを予定から外します" : "この日だけを個別の予定として変更します",
      icon: CalendarDays,
    },
    {
      scope: "following",
      label: `この日以降（${formatDate(date)}〜）`,
      description: isDelete ? "この日から後をすべて削除します" : "この日から後の期間に変更を反映します",
      icon: CalendarArrowDown,
    },
    {
      scope: "all",
      label: "すべての期間",
      description: isDelete ? "シリーズ全体を削除します" : "シリーズ全体に変更を反映します",
      icon: CalendarRange,
    },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm sm:items-center sm:p-4"
      onClick={(e) => {
        e.stopPropagation();
        onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-scope-title"
        onClick={(e) => e.stopPropagation()}
        className="w-full rounded-t-2xl bg-white p-5 shadow-2xl sm:max-w-sm sm:rounded-2xl"
      >
        <div className="mb-1 flex items-center justify-between">
          <h2 id="edit-scope-title" className="text-base font-semibold text-gray-900">
            繰り返しの予定を{verb}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
            aria-label="閉じる"
          >
            <X className="h-5 w-5" strokeWidth={2} />
          </button>
        </div>
        <p className="mb-4 text-xs text-gray-500">{verb}を反映する範囲を選んでください。</p>

        <div className="flex flex-col gap-2">
          {options.map(({ scope, label, description, icon: Icon }) => (
            <button
              key={scope}
              type="button"
              onClick={() => onSelect(scope)}
              className={`flex items-center gap-3 rounded-xl border px-3.5 py-3 text-left transition-colors ${
                isDelete
                  ? "border-gray-200 hover:border-rose-300 hover:bg-rose-50"
                  : "border-gray-200 hover:border-gray-400 hover:bg-gray-50"
              }`}
            >
              <Icon className={`h-5 w-5 shrink-0 ${isDelete ? "text-rose-500" : "text-gray-500"}`} strokeWidth={2} />
              <span className="min-w-0">
                <span className={`block text-sm font-semibold ${isDelete ? "text-rose-600" : "text-gray-900"}`}>
                  {label}
                </span>
                <span className="block text-xs text-gray-500">{description}</span>
              </span>
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={onClose}
          className="mt-4 w-full rounded-full border border-gray-300 px-4 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50"
        >
          キャンセル
        </button>
      </div>
    </div>
  );
}
