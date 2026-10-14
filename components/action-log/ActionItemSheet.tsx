"use client";

import type { ReactNode } from "react";
import { createPortal } from "react-dom";
import { useVisualViewport } from "@/hooks/useVisualViewport";

/**
 * スマホで行動の起点を追加・編集するための入力カード。
 * キーボードを除いた見えている範囲の中央に出すので、ページのスクロール位置や上にある内容の長さに関係なく入力欄が見える
 */
export default function ActionItemSheet({
  title,
  dotClass,
  textClass,
  onClose,
  children,
}: {
  title: string;
  dotClass: string;
  textClass: string;
  onClose: () => void;
  children: ReactNode;
}) {
  const viewport = useVisualViewport();

  // 日付カードの transform / backdrop-filter の影響で fixed がずれないよう、body 直下に描画する
  return createPortal(
    <div
      style={viewport ? { top: viewport.top, height: viewport.height, bottom: "auto" } : undefined}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4"
      onClick={(e) => {
        // ポータルでも React のイベントは日付カードへ伝わるため、ここで止める
        e.stopPropagation();
        onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-2xl bg-white p-4 shadow-2xl"
      >
        <p className={`mb-2.5 flex items-center gap-1.5 text-sm font-bold ${textClass}`}>
          <span className={`h-2 w-2 rounded-full ${dotClass}`} />
          {title}
        </p>
        {children}
      </div>
    </div>,
    document.body
  );
}
