"use client";

import { useEffect, type RefObject } from "react";

/** sticky ヘッダーに隠れないよう、上端に確保する余白(px) */
const TOP_MARGIN = 76;
/** キーボードの上に重なる Safari のアドレスバーに隠れないよう、下端に確保する余白(px) */
const BOTTOM_MARGIN = 80;
/** キーボードのアニメーションが落ち着くのを待つ時間(ms) */
const SETTLE_DELAY = 150;
/** フォーカス後、キーボード表示に合わせて位置を調整し続ける時間(ms) */
const ADJUST_WINDOW = 1200;

function findScrollableAncestor(el: HTMLElement): HTMLElement | null {
  let node = el.parentElement;
  while (node && node !== document.body) {
    const { overflowY } = getComputedStyle(node);
    if ((overflowY === "auto" || overflowY === "scroll") && node.scrollHeight > node.clientHeight) {
      return node;
    }
    node = node.parentElement;
  }
  return null;
}

/** 入力欄が、キーボードを除いた見えている領域からはみ出していれば上寄りに収める */
function scrollIntoVisibleArea(el: HTMLElement) {
  const vv = window.visualViewport;
  const viewTop = vv ? vv.offsetTop : 0;
  const viewBottom = vv ? vv.offsetTop + vv.height : window.innerHeight;
  const container = findScrollableAncestor(el);
  const containerRect = container?.getBoundingClientRect();
  const visibleTop = Math.max(viewTop + TOP_MARGIN, containerRect ? containerRect.top : -Infinity);
  const visibleBottom = Math.min(viewBottom - BOTTOM_MARGIN, containerRect ? containerRect.bottom : Infinity);

  const rect = el.getBoundingClientRect();
  if (rect.top >= visibleTop && rect.bottom <= visibleBottom) return;

  // 見えている領域の上から 1/3 あたりに入力欄が来るようにする。Safari で未対応の behavior 指定を避けて数値で動かす
  const target = visibleTop + Math.max(0, (visibleBottom - visibleTop - rect.height) / 3);
  const delta = rect.top - target;
  if (container) container.scrollTop += delta;
  else window.scrollTo(0, window.scrollY + delta);
}

/** マウント時(autoFocus 時)に、入力欄が画面外やキーボードの裏にあれば見える位置へスクロールする */
export function useScrollIntoViewOnKeyboard(ref: RefObject<HTMLElement | null>, enabled = true) {
  useEffect(() => {
    if (!enabled || !ref.current) return;
    const vv = window.visualViewport;

    let timer: number | undefined;
    const run = () => {
      if (ref.current) scrollIntoVisibleArea(ref.current);
    };
    // キーボードのアニメーション中は visualViewport が何度も変わるので、落ち着いてから位置を合わせる
    const schedule = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(run, SETTLE_DELAY);
    };

    vv?.addEventListener("resize", schedule);
    // キーボードが出ない環境(PC など)でも、入力欄が画面外なら見える位置へ動かす
    const initialTimer = window.setTimeout(run, 400);
    const stopTimer = window.setTimeout(() => vv?.removeEventListener("resize", schedule), ADJUST_WINDOW);

    return () => {
      vv?.removeEventListener("resize", schedule);
      window.clearTimeout(timer);
      window.clearTimeout(initialTimer);
      window.clearTimeout(stopTimer);
    };
  }, [ref, enabled]);
}
