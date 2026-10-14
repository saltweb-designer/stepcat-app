"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import ActionLogSection from "./ActionLogSection";

/** 指定日の「行動の起点」リストをモーダルで編集する。項目は追加・編集のたびに保存される */
export default function ActionLogModal({ date, onClose }: { date: string; onClose: () => void }) {
  const [, m, d] = date.split("-");
  const dateLabel = `${Number(m)}月${Number(d)}日`;
  /** スマホでキーボードが開いたとき、モーダルをキーボードの上の見えている領域に収める */
  const [viewport, setViewport] = useState<{ top: number; height: number } | null>(null);

  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;
    const update = () => setViewport({ top: vv.offsetTop, height: vv.height });
    update();
    vv.addEventListener("resize", update);
    vv.addEventListener("scroll", update);
    return () => {
      vv.removeEventListener("resize", update);
      vv.removeEventListener("scroll", update);
    };
  }, []);

  return (
    <div
      style={viewport ? { top: viewport.top, height: viewport.height, bottom: "auto" } : undefined}
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm p-0 sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="action-log-modal-title"
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[90%] w-full flex-col overflow-hidden rounded-t-2xl bg-white shadow-2xl sm:max-w-lg sm:rounded-2xl"
      >
        <header className="flex shrink-0 items-center justify-between border-b border-gray-100 px-5 py-4">
          <h2 id="action-log-modal-title" className="text-base font-semibold text-gray-900">
            {dateLabel}の行動の起点
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

        <div className="flex-1 overflow-y-auto px-5 py-4">
          <ActionLogSection date={date} />
        </div>
      </div>
    </div>
  );
}
