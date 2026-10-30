"use client";

import { useMemo, useState } from "react";
import { Plus, Search, Shuffle, X, type LucideIcon } from "lucide-react";
import Header from "@/components/layout/Header";
import LoginPrompt from "@/components/auth/LoginPrompt";
import ErrorBanner from "@/components/dashboard/ErrorBanner";
import NoteCategoryFilter, { ALL_CATEGORIES } from "@/components/notes/NoteCategoryFilter";
import NoteCategoryModal from "@/components/notes/NoteCategoryModal";
import ChannelStrip, { type ChannelSummary } from "@/components/videos/ChannelStrip";
import NewVideoCard from "@/components/videos/NewVideoCard";
import NowPlayingButton from "@/components/videos/NowPlayingButton";
import VideoCard from "@/components/videos/VideoCard";
import { useAuth } from "@/contexts/AuthContext";
import { useChannelOrder } from "@/hooks/useChannelOrder";
import { useMediaPlayer } from "@/contexts/MediaPlayerContext";
import { useNoteCategories } from "@/hooks/useNoteCategories";
import { useVideos, type MediaCollection } from "@/hooks/useVideos";
import { UNCATEGORIZED_ID } from "@/lib/notes";
import type { VideoDoc } from "@/lib/types";
import { toIsoDate } from "@/lib/week";

/** 同じチャンネルの動画をまとめるキー。チャンネルURLが無ければ名前で代用する */
function channelKeyOf(video: VideoDoc) {
  return video.channelUrl || video.channelName.trim();
}

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
 * 日付と動画IDから並び順を決めるシャッフル。同じ日なら開き直しても・別の端末でも同じ順番で、
 * 日付が変わると順番が入れ替わる。動画を追加・削除しても他の動画同士の順番は変わらない
 */
function shuffleByDay(videos: VideoDoc[], dayKey: string) {
  const keyById = new Map(videos.map((video) => [video.id, hashString(`${dayKey}:${video.id}`)]));
  return [...videos].sort((a, b) => keyById.get(a.id)! - keyById.get(b.id)!);
}

/**
 * 動画ページ・音楽ページ共通の画面。見た目と機能は同じで、
 * 保存先のコレクション（登録したもの・カテゴリ）はページごとに完全に分ける
 */
export default function MediaLibraryPage({
  title,
  icon: Icon,
  itemsCollection,
  categoriesCollection,
  shuffleDaily = false,
}: {
  title: string;
  icon: LucideIcon;
  itemsCollection: MediaCollection;
  categoriesCollection: "videoCategories" | "musicCategories" | "trainingVideoCategories";
  /** 「すべて」表示（絞り込み・検索なし）のとき1日ごとに並び順をシャッフルし、手動のシャッフルボタンも出す */
  shuffleDaily?: boolean;
}) {
  const { user, loading } = useAuth();
  const { videos, error: videosError, addVideo, updateVideo, setVideoPinned, deleteVideo } = useVideos(user?.uid, itemsCollection);
  const {
    categories,
    error: categoriesError,
    addCategory,
    renameCategory,
    deleteCategory,
    reorderCategories,
  } = useNoteCategories(user?.uid, categoriesCollection);
  const { order: channelOrder, saveOrder: saveChannelOrder } = useChannelOrder(user?.uid, itemsCollection);

  const [selectedCategory, setSelectedCategory] = useState<string>(ALL_CATEGORIES);
  const [selectedChannel, setSelectedChannel] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [newItemOpen, setNewItemOpen] = useState(false);
  // シャッフルボタンを押したときの並び順の種。押すまでは null で、日替わりの順番を使う
  const [manualShuffleSeed, setManualShuffleSeed] = useState<string | null>(null);
  // 再生中の動画はアプリ全体で1つ。この一覧にあるときだけ、画面右下に戻るボタンと再生/一時停止ボタンを出す
  const { current: nowPlaying, paused, togglePlayback } = useMediaPlayer();

  const categoryNameById = useMemo(() => {
    const map = new Map<string, string>();
    for (const category of categories) map.set(category.id, category.name);
    return map;
  }, [categories]);

  const categoryNameFor = (categoryId: string) => categoryNameById.get(categoryId) ?? "未分類";

  // 並び替えで保存した順番を使う。まだ並び順に入っていない新しいチャンネルは先頭に置き、
  // その中では動画が新しい順なので、最近登録したチャンネルほど先頭に来る
  const channels = useMemo(() => {
    const map = new Map<string, ChannelSummary>();
    for (const video of videos) {
      const key = channelKeyOf(video);
      if (!key || map.has(key)) continue;
      map.set(key, { key, name: video.channelName || "名称未設定", iconUrl: video.channelIconUrl });
    }
    const saved = new Set(channelOrder);
    const newChannels = [...map.values()].filter((channel) => !saved.has(channel.key));
    const orderedChannels = channelOrder.flatMap((key) => map.get(key) ?? []);
    return [...newChannels, ...orderedChannels];
  }, [videos, channelOrder]);

  const activeChannel = selectedChannel && channels.some((c) => c.key === selectedChannel) ? selectedChannel : null;

  const todayKey = toIsoDate(new Date());

  // ピン留めした動画を先頭に固定し、それぞれの中では新しい順を保つ（sort は安定ソート）。
  // shuffleDaily のときは「すべて」表示に限り、ピン留め以外を日替わりの順番にする。
  // シャッフルボタンを押した後は、表示中の一覧をその押した回ごとの順番にする
  const filteredVideos = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const matched = videos.filter((video) => {
      if (selectedCategory === UNCATEGORIZED_ID) {
        if (video.categoryId && categoryNameById.has(video.categoryId)) return false;
      } else if (selectedCategory !== ALL_CATEGORIES && video.categoryId !== selectedCategory) {
        return false;
      }
      if (activeChannel && channelKeyOf(video) !== activeChannel) return false;
      if (!q) return true;
      const haystack = [video.title, video.channelName, video.memo, categoryNameById.get(video.categoryId) ?? ""]
        .join("\n")
        .toLowerCase();
      return haystack.includes(q);
    });
    const isAllView = selectedCategory === ALL_CATEGORIES && !activeChannel && !q;
    let ordered = matched;
    if (shuffleDaily && manualShuffleSeed) ordered = shuffleByDay(matched, manualShuffleSeed);
    else if (shuffleDaily && isAllView) ordered = shuffleByDay(matched, todayKey);
    return ordered.sort((a, b) => Number(b.pinned) - Number(a.pinned));
  }, [videos, selectedCategory, activeChannel, searchQuery, categoryNameById, shuffleDaily, todayKey, manualShuffleSeed]);

  // 絞り込みでカードが消えたときは、プレーヤー側が右下に小さく出るので、こちらのボタンは隠す
  const playingVideo = nowPlaying ? filteredVideos.find((video) => video.id === nowPlaying.item.id) : undefined;

  const newVideoCategoryId = selectedCategory === ALL_CATEGORIES ? UNCATEGORIZED_ID : selectedCategory;
  const isFiltering = selectedCategory !== ALL_CATEGORIES || activeChannel !== null || searchQuery.trim() !== "";

  return (
    <div className="min-h-screen bg-gray-100">
      <Header />
      <main className="mx-auto flex max-w-2xl flex-col gap-3 px-4 py-6 pb-10 sm:px-6">
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-gray-900" />
          </div>
        ) : user ? (
          <>
            {(videosError || categoriesError) && <ErrorBanner message={videosError ?? categoriesError ?? ""} />}

            <div className="flex items-center justify-between gap-2">
              <h2 className="flex shrink-0 items-center gap-1.5 text-sm font-semibold text-gray-700">
                <Icon className="h-4 w-4 shrink-0 text-gray-400" strokeWidth={2} />
                {title}
              </h2>
              {shuffleDaily && (
                <button
                  type="button"
                  onClick={() => setManualShuffleSeed(String(Math.random()))}
                  className="ml-auto flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-gray-500 shadow-sm transition-colors hover:text-gray-800"
                  aria-label="並び順をシャッフル"
                >
                  <Shuffle className="h-3.5 w-3.5" strokeWidth={2.5} />
                </button>
              )}
              <button
                type="button"
                onClick={() => setNewItemOpen((open) => !open)}
                className={`${shuffleDaily ? "" : "ml-auto "}flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-900 text-white shadow-sm transition-colors hover:bg-gray-700`}
                aria-label={newItemOpen ? "新規登録を閉じる" : "新規登録"}
                aria-expanded={newItemOpen}
              >
                {newItemOpen ? <X className="h-4 w-4" strokeWidth={2.5} /> : <Plus className="h-4 w-4" strokeWidth={2.5} />}
              </button>
              <div className="relative w-full max-w-[45%] sm:max-w-[14rem]">
                <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" strokeWidth={2} />
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="検索"
                  className="w-full rounded-full bg-white py-1.5 pl-7 pr-7 text-base text-gray-700 placeholder-gray-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-black/20 sm:text-xs [&::-webkit-search-cancel-button]:hidden"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    aria-label="検索をクリア"
                  >
                    <X className="h-3.5 w-3.5" strokeWidth={2} />
                  </button>
                )}
              </div>
            </div>

            {channels.length > 0 && (
              <ChannelStrip
                channels={channels}
                selected={activeChannel}
                onSelect={setSelectedChannel}
                onReorder={(keys) => saveChannelOrder(keys)}
              />
            )}

            <NoteCategoryFilter
              categories={categories}
              selected={selectedCategory}
              onSelect={setSelectedCategory}
              onManage={() => setCategoryModalOpen(true)}
            />

            <NewVideoCard
              open={newItemOpen}
              onClose={() => setNewItemOpen(false)}
              categories={categories}
              initialCategoryId={newVideoCategoryId}
              onCreate={addVideo}
              onManageCategories={() => setCategoryModalOpen(true)}
            />

            {filteredVideos.length === 0 ? (
              <p className="py-8 text-center text-sm text-gray-400">
                {isFiltering && videos.length > 0 ? `該当する${title}が見つかりません` : `まだ${title}が登録されていません`}
              </p>
            ) : (
              <div className="flex flex-col gap-3">
                {filteredVideos.map((video) => (
                  <VideoCard
                    key={video.id}
                    video={video}
                    categoryName={categoryNameFor(video.categoryId)}
                    categories={categories}
                    onSave={(input) => updateVideo(video.id, input)}
                    onDelete={() => deleteVideo(video.id)}
                    onTogglePin={() => setVideoPinned(video.id, !video.pinned)}
                    onManageCategories={() => setCategoryModalOpen(true)}
                    itemLabel={title}
                  />
                ))}
              </div>
            )}
          </>
        ) : (
          <LoginPrompt />
        )}
      </main>

      {playingVideo && <NowPlayingButton video={playingVideo} paused={paused} onTogglePlayback={togglePlayback} />}

      {categoryModalOpen && (
        <NoteCategoryModal
          categories={categories}
          itemLabel={title}
          onAdd={addCategory}
          onRename={renameCategory}
          onDelete={deleteCategory}
          onReorder={reorderCategories}
          onClose={() => setCategoryModalOpen(false)}
        />
      )}
    </div>
  );
}
