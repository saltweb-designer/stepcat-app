"use client";

import { useMemo, useState } from "react";
import { KeyRound, Plus, Search, Shuffle, X } from "lucide-react";
import Header from "@/components/layout/Header";
import LoginPrompt from "@/components/auth/LoginPrompt";
import ErrorBanner from "@/components/dashboard/ErrorBanner";
import InlineAccordion from "@/components/notes/InlineAccordion";
import NoteCategoryFilter, { ALL_CATEGORIES } from "@/components/notes/NoteCategoryFilter";
import NoteCategoryModal from "@/components/notes/NoteCategoryModal";
import PrimeCard from "@/components/prime/PrimeCard";
import PrimeGenreStrip from "@/components/prime/PrimeGenreStrip";
import PrimeInlineForm from "@/components/prime/PrimeInlineForm";
import { useAuth } from "@/contexts/AuthContext";
import { useNoteCategories } from "@/hooks/useNoteCategories";
import { usePrimeVideos } from "@/hooks/usePrimeVideos";
import { UNCATEGORIZED_ID } from "@/lib/notes";
import { primeGenreLabel, type PrimeGenre } from "@/lib/prime-genres";
import { shuffleByDay } from "@/lib/shuffle";
import type { PrimeVideoInput } from "@/lib/types";
import { toIsoDate } from "@/lib/week";

const TITLE = "アマプラ";

/**
 * Amazonプライムビデオの作品リンクを集めるページ。アプリ内では再生できないので、
 * 小さなリンクカードを並べ、押すとプライムビデオを開く。カテゴリ・検索・ピン留め・シャッフルは動画ページと同じ。
 * カテゴリの上に大カテゴリ（アニメ・ドラマなど）の丸いアイコンを置き、大枠でも絞り込めるようにする
 */
export default function PrimePage() {
  const { user, loading } = useAuth();
  const { items, error: itemsError, addItem, updateItem, setItemPinned, deleteItem } = usePrimeVideos(user?.uid);
  const {
    categories,
    error: categoriesError,
    addCategory,
    renameCategory,
    deleteCategory,
    reorderCategories,
  } = useNoteCategories(user?.uid, "primeVideoCategories");

  const [selectedGenre, setSelectedGenre] = useState<PrimeGenre | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>(ALL_CATEGORIES);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [newItemOpen, setNewItemOpen] = useState(false);
  // シャッフルボタンを押したときの並び順の種。押すまでは null で、日替わりの順番を使う
  const [manualShuffleSeed, setManualShuffleSeed] = useState<string | null>(null);

  const categoryNameById = useMemo(() => {
    const map = new Map<string, string>();
    for (const category of categories) map.set(category.id, category.name);
    return map;
  }, [categories]);

  const todayKey = toIsoDate(new Date());

  // ピン留めした作品を先頭に固定する。「すべて」表示（絞り込み・検索なし）のときは日替わりの順番にし、
  // シャッフルボタンを押した後は、表示中の一覧をその押した回ごとの順番にする
  const filteredItems = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const matched = items.filter((item) => {
      if (selectedGenre && item.genre !== selectedGenre) return false;
      if (selectedCategory === UNCATEGORIZED_ID) {
        if (item.categoryId && categoryNameById.has(item.categoryId)) return false;
      } else if (selectedCategory !== ALL_CATEGORIES && item.categoryId !== selectedCategory) {
        return false;
      }
      if (!q) return true;
      const haystack = [item.title, item.memo, primeGenreLabel(item.genre), categoryNameById.get(item.categoryId) ?? ""].join("\n").toLowerCase();
      return haystack.includes(q);
    });
    const isAllView = !selectedGenre && selectedCategory === ALL_CATEGORIES && !q;
    let ordered = matched;
    if (manualShuffleSeed) ordered = shuffleByDay(matched, manualShuffleSeed);
    else if (isAllView) ordered = shuffleByDay(matched, todayKey);
    return ordered.sort((a, b) => Number(b.pinned) - Number(a.pinned));
  }, [items, selectedGenre, selectedCategory, searchQuery, categoryNameById, todayKey, manualShuffleSeed]);

  const newItemCategoryId = selectedCategory === ALL_CATEGORIES ? UNCATEGORIZED_ID : selectedCategory;
  // 大カテゴリで絞り込んでいるときは、新規登録の大カテゴリもそれにしておく
  const newItemGenre = selectedGenre ?? "other";
  const newItem = useMemo<PrimeVideoInput>(
    () => ({ url: "", title: "", imageDataUrl: "", genre: newItemGenre, categoryId: newItemCategoryId, memo: "" }),
    [newItemGenre, newItemCategoryId]
  );
  const isFiltering = selectedGenre !== null || selectedCategory !== ALL_CATEGORIES || searchQuery.trim() !== "";

  const handleCreate = async (input: PrimeVideoInput) => {
    await addItem(input);
    setNewItemOpen(false);
  };

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
            {(itemsError || categoriesError) && <ErrorBanner message={itemsError ?? categoriesError ?? ""} />}

            <div className="flex items-center justify-between gap-2">
              <h2 className="flex shrink-0 items-center gap-1.5 text-sm font-semibold text-gray-700">
                <KeyRound className="h-4 w-4 shrink-0 text-gray-400" strokeWidth={2} />
                {TITLE}
              </h2>
              <button
                type="button"
                onClick={() => setManualShuffleSeed(String(Math.random()))}
                className="ml-auto flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-gray-500 shadow-sm transition-colors hover:text-gray-800"
                aria-label="並び順をシャッフル"
              >
                <Shuffle className="h-3.5 w-3.5" strokeWidth={2.5} />
              </button>
              <button
                type="button"
                onClick={() => setNewItemOpen((open) => !open)}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-900 text-white shadow-sm transition-colors hover:bg-gray-700"
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

            <PrimeGenreStrip selected={selectedGenre} onSelect={setSelectedGenre} />

            <NoteCategoryFilter
              categories={categories}
              selected={selectedCategory}
              onSelect={setSelectedCategory}
              onManage={() => setCategoryModalOpen(true)}
            />

            {/* 閉じている間は高さ0になるので、親の gap 分の余白も打ち消して詰める */}
            <div className={`transition-[margin] duration-300 ease-in-out ${newItemOpen ? "" : "-mt-3"}`}>
              <InlineAccordion open={newItemOpen}>
                <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-4">
                  <p className="text-xs font-semibold text-gray-500">新規登録</p>
                  <PrimeInlineForm
                    active={newItemOpen}
                    initialItem={newItem}
                    categories={categories}
                    onSave={handleCreate}
                    onCancel={() => setNewItemOpen(false)}
                    onManageCategories={() => setCategoryModalOpen(true)}
                    submitLabel="追加"
                  />
                </div>
              </InlineAccordion>
            </div>

            {filteredItems.length === 0 ? (
              <p className="py-8 text-center text-sm text-gray-400">
                {isFiltering && items.length > 0 ? `該当する${TITLE}が見つかりません` : `まだ${TITLE}が登録されていません`}
              </p>
            ) : (
              <div className="flex flex-col gap-2">
                {filteredItems.map((item) => (
                  <PrimeCard
                    key={item.id}
                    item={item}
                    categoryName={categoryNameById.get(item.categoryId) ?? "未分類"}
                    categories={categories}
                    onSave={(input) => updateItem(item.id, input)}
                    onDelete={() => deleteItem(item.id)}
                    onTogglePin={() => setItemPinned(item.id, !item.pinned)}
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
          itemLabel={TITLE}
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
