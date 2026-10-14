"use client";

import { useEffect, useLayoutEffect, type RefObject } from "react";

/** sticky ヘッダーに隠れないよう、上端に確保する余白(px) */
const TOP_MARGIN = 76;
/** キーボードの上に重なる Safari のアドレスバーに隠れないよう、下端に確保する余白(px) */
const BOTTOM_MARGIN = 80;
/**
 * スマホでキーボードが開いても隠れない範囲(画面の高さに対する割合)。
 * iPhone のキーボード + 入力補助バーは画面の下半分強を覆うため、上 35% に収める
 */
const SAFE_AREA_RATIO = 0.35;
/** キーボードのアニメーションが落ち着くのを待つ時間(ms) */
const SETTLE_DELAY = 120;
/** フォーカス後、キーボード表示に合わせて位置を調整し続ける時間(ms) */
const ADJUST_WINDOW = 1500;

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

/** Safari で未対応の behavior 指定を避けるため、数値指定でスクロールする */
function scrollByDelta(container: HTMLElement | null, delta: number) {
  if (Math.abs(delta) < 1) return;
  if (container) container.scrollTop += delta;
  else window.scrollTo(0, window.scrollY + delta);
}

function isTouchDevice() {
  return window.matchMedia("(pointer: coarse)").matches;
}

/**
 * キーボードが開く前に、入力欄をヘッダーのすぐ下へ移動しておく。
 * 最初から画面の上の方にあれば、キーボードが開いても隠れず、Safari 独自のスクロールも起きない。
 * data-keyboard-anchor を付けた祖先(見出しを含む枠)があれば、収まる範囲でその上端を揃える
 */
function moveToTopBeforeKeyboard(el: HTMLElement) {
  const container = findScrollableAncestor(el);
  const rect = el.getBoundingClientRect();
  const top = container ? container.getBoundingClientRect().top + 12 : TOP_MARGIN;
  const safeBottom = container
    ? top + container.clientHeight * SAFE_AREA_RATIO
    : window.innerHeight * SAFE_AREA_RATIO;
  if (rect.top >= top && rect.bottom <= safeBottom) return;

  const anchor = el.closest<HTMLElement>("[data-keyboard-anchor]");
  const anchorTop = anchor?.getBoundingClientRect().top;
  // 見出しごと上端に揃えても入力欄が安全な範囲に収まるなら見出しを、収まらなければ入力欄を基準にする
  const base = anchorTop !== undefined && rect.bottom - anchorTop + top <= safeBottom ? anchorTop : rect.top;
  scrollByDelta(container, base - top);
}

/** キーボード表示後、入力欄がキーボードを除いた見えている領域からはみ出していれば上寄りに収める */
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
  scrollByDelta(container, rect.top - target);
}

/**
 * マウント時(autoFocus 時)に、入力欄がスマホのキーボードに隠れないようスクロールする。
 * iOS Safari はキーボード表示でレイアウトの高さが変わらないため、
 * キーボードが開く前に上へ寄せておき、開いた後も visualViewport を基準に位置を確かめる。
 */
export function useScrollIntoViewOnKeyboard(ref: RefObject<HTMLElement | null>) {
  useLayoutEffect(() => {
    if (ref.current && isTouchDevice()) moveToTopBeforeKeyboard(ref.current);
  }, [ref]);

  useEffect(() => {
    if (!ref.current) return;
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
    vv?.addEventListener("scroll", schedule);
    // resize が来ない環境(PC など)や、Safari が後から独自にスクロールした場合に備えて数回確かめる
    const checkTimers = [400, 900].map((ms) => window.setTimeout(run, ms));
    const stopTimer = window.setTimeout(() => {
      vv?.removeEventListener("resize", schedule);
      vv?.removeEventListener("scroll", schedule);
    }, ADJUST_WINDOW);

    return () => {
      active = false;
      vv?.removeEventListener("resize", schedule);
      vv?.removeEventListener("scroll", schedule);
      window.clearTimeout(timer);
      checkTimers.forEach((t) => window.clearTimeout(t));
      window.clearTimeout(stopTimer);
    };
  }, [ref]);
}
