"use client";

import { useEffect, useState } from "react";

export type ViewportRect = { top: number; height: number };

function readViewport(): ViewportRect | null {
  if (typeof window === "undefined" || !window.visualViewport) return null;
  return { top: window.visualViewport.offsetTop, height: window.visualViewport.height };
}

/**
 * キーボードを除いた、実際に見えている画面の範囲。
 * iOS Safari はキーボード表示でレイアウトの高さが変わらないため、fixed 要素をこの範囲に合わせて配置する
 */
export function useVisualViewport(): ViewportRect | null {
  const [viewport, setViewport] = useState<ViewportRect | null>(readViewport);

  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;
    const update = () => setViewport({ top: vv.offsetTop, height: vv.height });
    vv.addEventListener("resize", update);
    vv.addEventListener("scroll", update);
    return () => {
      vv.removeEventListener("resize", update);
      vv.removeEventListener("scroll", update);
    };
  }, []);

  return viewport;
}
