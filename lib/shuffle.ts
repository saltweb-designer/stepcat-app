/** 文字列から 32bit の数値を作る（FNV-1a）。同じ文字列なら常に同じ値になる */
function hashString(text: string) {
  let hash = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

/**
 * 日付とIDから並び順を決めるシャッフル。同じ日なら開き直しても・別の端末でも同じ順番で、
 * 日付が変わると順番が入れ替わる。追加・削除しても他のもの同士の順番は変わらない
 */
export function shuffleByDay<T extends { id: string }>(items: T[], dayKey: string) {
  const keyById = new Map(items.map((item) => [item.id, hashString(`${dayKey}:${item.id}`)]));
  return [...items].sort((a, b) => keyById.get(a.id)! - keyById.get(b.id)!);
}
