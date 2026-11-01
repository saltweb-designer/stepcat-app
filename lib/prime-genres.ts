import { Camera, Clapperboard, Drama, Ellipsis, Sparkles, type LucideIcon } from "lucide-react";

/** アマプラの大カテゴリ。ユーザーが作るカテゴリとは別に、決まった5つから選ぶ */
export const PRIME_GENRES = [
  { id: "anime", label: "アニメ", icon: Sparkles },
  { id: "drama", label: "ドラマ", icon: Drama },
  { id: "movie", label: "映画", icon: Clapperboard },
  { id: "real", label: "リアル", icon: Camera },
  { id: "other", label: "その他", icon: Ellipsis },
] as const satisfies readonly { id: string; label: string; icon: LucideIcon }[];

export type PrimeGenre = (typeof PRIME_GENRES)[number]["id"];

/** 大カテゴリを付ける前に登録したものや、知らない値は「その他」として扱う */
export function toPrimeGenre(value: unknown): PrimeGenre {
  return PRIME_GENRES.some((genre) => genre.id === value) ? (value as PrimeGenre) : "other";
}

export function primeGenreLabel(id: PrimeGenre) {
  return PRIME_GENRES.find((genre) => genre.id === id)?.label ?? "その他";
}
