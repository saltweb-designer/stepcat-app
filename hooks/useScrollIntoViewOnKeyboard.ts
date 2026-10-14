"use client";

import { useEffect, type RefObject } from "react";

/** sticky ヘッダーに隠れないよう、上端に確保する余白(px) */
const TOP_MARGIN = 80;
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

/** 入力欄を、キーボードを除いた実際に見えている領域の上寄りに収める */
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

  // 見えている領域の上から 1/3 あたりに入力欄が来るようにする
  const target = visibleTop + Math.max(0, (visibleBottom - visibleTop - rect.height) / 3);
  const delta = rect.top - target;
  if (container) container.scrollBy({ top: delta, behavior: "instant" });
  else window.scrollBy({ top: delta, behavior: "instant" });
}

/**
 * マウント時(autoFocus 時)に、スマホのキーボード表示を待ってから入力欄を見える位置へスクロールする。
 * iOS Safari はキーボード表示でレイアウトの高さが変わらないため、visualViewport を基準に位置を合わせる。
 */
export function useScrollIntoViewOnKeyboard(ref: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const vv = window.visualViewport;

    let active = true;
    let timer: number | undefined;
    const run = () => {
      if (active && ref.current) scrollIntoVisibleArea(ref.current);
    };
    // キーボードのアニメーション中は visualViewport が何度も変わるので、落ち着いてから位置を合わせる
    const schedule = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(run, SETTLE_DELAY);
    };

    vv?.addEventListener("resize", schedule);
    // PC などキーボードが出ない環境でも、入力欄が画面外なら見える位置へ動かす
    const initialTimer = window.setTimeout(run, 400);
    const stopTimer = window.setTimeout(() => {
      vv?.removeEventListener("resize", schedule);
    }, ADJUST_WINDOW);

    return () => {
      active = false;
      vv?.removeEventListener("resize", schedule);
      window.clearTimeout(timer);
      window.clearTimeout(initialTimer);
      window.clearTimeout(stopTimer);
    };
  }, [ref]);
}
