"use client";

import { useMemo, useState } from "react";
import { MonitorPlay, Search, X } from "lucide-react";
import Header from "@/components/layout/Header";
import LoginPrompt from "@/components/auth/LoginPrompt";
import ErrorBanner from "@/components/dashboard/ErrorBanner";
import NoteCategoryFilter, { ALL_CATEGORIES } from "@/components/notes/NoteCategoryFilter";
import NoteCategoryModal from "@/components/notes/NoteCategoryModal";
import ChannelStrip, { type ChannelSummary } from "@/components/videos/ChannelStrip";
import NewVideoCard from "@/components/videos/NewVideoCard";
import VideoCard from "@/components/videos/VideoCard";
import { useAuth } from "@/contexts/AuthContext";
import { useNoteCategories } from "@/hooks/useNoteCategories";
import { useVideos } from "@/hooks/useVideos";
import { UNCATEGORIZED_ID } from "@/lib/notes";
import type { VideoDoc } from "@/lib/types";

/** 同じチャンネルの動画をまとめるキー。チャンネルURLが無ければ名前で代用する */
function channelKeyOf(video: VideoDoc) {
  return video.channelUrl || video.channelName.trim();
}

export default function VideosPage() {
  const { user, loading } = useAuth();
  const { videos, error: videosError, addVideo, updateVideo, deleteVideo } = useVideos(user?.uid);
  const {
    categories,
    error: categoriesError,
    addCategory,
    renameCategory,
    deleteCategory,
  } = useNoteCategories(user?.uid, "videoCategories");

  const [selectedCategory, setSelectedCategory] = useState<string>(ALL_CATEGORIES);
  const [selectedChannel, setSelectedChannel] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);

  const categoryNameById = useMemo(() => {
    const map = new Map<string, string>();
    for (const category of categories) map.set(category.id, category.name);
    return map;
  }, [categories]);

  const categoryNameFor = (categoryId: string) => categoryNameById.get(categoryId) ?? "未分類";

  // 動画は新しい順に並んでいるので、最近登録したチャンネルほど先頭に来る
  const channels = useMemo(() => {
    const map = new Map<string, ChannelSummary>();
    for (const video of videos) {
      const key = channelKeyOf(video);
      if (!key || map.has(key)) continue;
      map.set(key, { key, name: video.channelName || "名称未設定", iconUrl: video.channelIconUrl });
    }
    return [...map.values()];
  }, [videos]);

  const activeChannel = selectedChannel && channels.some((c) => c.key === selectedChannel) ? selectedChannel : null;

  const filteredVideos = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return videos.filter((video) => {
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
  }, [videos, selectedCategory, activeChannel, searchQuery, categoryNameById]);

  const newVideoCategoryId = selectedCategory === ALL_CATEGORIES ? UNCATEGORIZED_ID : selectedCategory;
  const isFiltering = selectedCategory !== ALL_CATEGORIES || activeChannel !== null || searchQuery.trim() !== "";

  return (
    <div className="min-h-screen bg-gray-100">
      <Header />
      <main className="mx-auto flex max-w-2xl flex-col gap-3 px-4 py-6 pb-32 sm:px-6">
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-gray-900" />
          </div>
        ) : user ? (
          <>
            {(videosError || categoriesError) && <ErrorBanner message={videosError ?? categoriesError ?? ""} />}

            <div className="flex items-center justify-between gap-3">
              <h2 className="flex shrink-0 items-center gap-1.5 text-sm font-semibold text-gray-700">
                <MonitorPlay className="h-4 w-4 shrink-0 text-gray-400" strokeWidth={2} />
                動画
              </h2>
              <div className="relative w-full max-w-[60%]">
                <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" strokeWidth={2} />
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="タイトル・アカウント名で検索"
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
              <ChannelStrip channels={channels} selected={activeChannel} onSelect={setSelectedChannel} />
            )}

            <NoteCategoryFilter
              categories={categories}
              selected={selectedCategory}
              onSelect={setSelectedCategory}
              onManage={() => setCategoryModalOpen(true)}
            />

            <NewVideoCard
              categories={categories}
              initialCategoryId={newVideoCategoryId}
              onCreate={addVideo}
              onManageCategories={() => setCategoryModalOpen(true)}
            />

            {filteredVideos.length === 0 ? (
              <p className="py-8 text-center text-sm text-gray-400">
                {isFiltering && videos.length > 0 ? "該当する動画が見つかりません" : "まだ動画が登録されていません"}
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
                    onManageCategories={() => setCategoryModalOpen(true)}
                  />
                ))}
              </div>
            )}
          </>
        ) : (
          <LoginPrompt />
        )}
      </main>

      {categoryModalOpen && (
        <NoteCategoryModal
          categories={categories}
          itemLabel="動画"
          onAdd={addCategory}
          onRename={renameCategory}
          onDelete={deleteCategory}
          onClose={() => setCategoryModalOpen(false)}
        />
      )}
    </div>
  );
}
