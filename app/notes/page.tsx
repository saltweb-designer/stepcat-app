"use client";

import { useMemo, useState } from "react";
import { NotebookPen, Search, X } from "lucide-react";
import Header from "@/components/layout/Header";
import LoginPrompt from "@/components/auth/LoginPrompt";
import ErrorBanner from "@/components/dashboard/ErrorBanner";
import NewNoteCard from "@/components/notes/NewNoteCard";
import NoteCard from "@/components/notes/NoteCard";
import NoteCategoryFilter, { ALL_CATEGORIES } from "@/components/notes/NoteCategoryFilter";
import NoteCategoryModal from "@/components/notes/NoteCategoryModal";
import { useAuth } from "@/contexts/AuthContext";
import { useNoteCategories } from "@/hooks/useNoteCategories";
import { useNotes } from "@/hooks/useNotes";
import { UNCATEGORIZED_ID } from "@/lib/notes";

export default function NotesPage() {
  const { user, loading } = useAuth();
  const {
    notes,
    error: notesError,
    addNote,
    updateNote,
    duplicateNote,
    setNotePinned,
    deleteNote,
  } = useNotes(user?.uid);
  const {
    categories,
    error: categoriesError,
    addCategory,
    renameCategory,
    deleteCategory,
    reorderCategories,
  } = useNoteCategories(user?.uid);

  const [selectedFilter, setSelectedFilter] = useState<string>(ALL_CATEGORIES);
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const categoryNameById = useMemo(() => {
    const map = new Map<string, string>();
    for (const category of categories) map.set(category.id, category.name);
    return map;
  }, [categories]);

  const categoryNameFor = (categoryId: string) => categoryNameById.get(categoryId) ?? "未分類";

  const filteredNotes = useMemo(() => {
    let result = notes;
    if (selectedFilter === UNCATEGORIZED_ID) {
      result = result.filter((note) => !note.categoryId || !categoryNameById.has(note.categoryId));
    } else if (selectedFilter !== ALL_CATEGORIES) {
      result = result.filter((note) => note.categoryId === selectedFilter);
    }
    const q = searchQuery.trim().toLowerCase();
    if (q) {
      result = result.filter(
        (note) =>
          note.text.toLowerCase().includes(q) ||
          (categoryNameById.get(note.categoryId) ?? "未分類").toLowerCase().includes(q)
      );
    }
    // ピン留めしたノートを先頭に。それ以外は更新順のまま
    return [...result].sort((a, b) => Number(b.pinned) - Number(a.pinned));
  }, [notes, selectedFilter, searchQuery, categoryNameById]);

  const newNoteCategoryId = selectedFilter === ALL_CATEGORIES ? UNCATEGORIZED_ID : selectedFilter;

  return (
    <div className="min-h-screen bg-gray-100">
      <Header />
      <main className="mx-auto flex max-w-2xl flex-col gap-4 px-4 py-6 pb-10 sm:px-6">
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-gray-900" />
          </div>
        ) : user ? (
          <>
            {(notesError || categoriesError) && <ErrorBanner message={notesError ?? categoriesError ?? ""} />}

            {/* AIに相談（AiQuickAskBox）は活用できていないため一旦非表示 */}

            <div className="flex items-center justify-between gap-2">
              <h2 className="flex shrink-0 items-center gap-1.5 text-sm font-semibold text-gray-700">
                <NotebookPen className="h-4 w-4 shrink-0 text-gray-400" strokeWidth={2} />
                ノート
              </h2>
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

            <NoteCategoryFilter
              categories={categories}
              selected={selectedFilter}
              onSelect={setSelectedFilter}
              onManage={() => setCategoryModalOpen(true)}
            />

            <NewNoteCard
              categories={categories}
              initialCategoryId={newNoteCategoryId}
              onCreate={addNote}
              onManageCategories={() => setCategoryModalOpen(true)}
            />

            {filteredNotes.length === 0 ? (
              <p className="py-8 text-center text-sm text-gray-400">
                {searchQuery.trim() ? "見つかりませんでした" : "まだノートがありません"}
              </p>
            ) : (
              <div className="flex flex-col gap-3">
                {filteredNotes.map((note) => (
                  <NoteCard
                    key={note.id}
                    note={note}
                    categoryName={categoryNameFor(note.categoryId)}
                    categories={categories}
                    onSave={(categoryId, text) => updateNote(note.id, categoryId, text)}
                    onDuplicate={() => duplicateNote(note)}
                    onTogglePin={() => setNotePinned(note.id, !note.pinned)}
                    onDelete={() => deleteNote(note.id)}
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
