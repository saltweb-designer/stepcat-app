"use client";

import { useMemo, useState } from "react";
import { NotebookPen } from "lucide-react";
import Header from "@/components/layout/Header";
import LoginPrompt from "@/components/auth/LoginPrompt";
import ErrorBanner from "@/components/dashboard/ErrorBanner";
import AiQuickAskBox from "@/components/notes/AiQuickAskBox";
import NoteCard from "@/components/notes/NoteCard";
import NoteCategoryFilter, { ALL_CATEGORIES } from "@/components/notes/NoteCategoryFilter";
import NoteCategoryModal from "@/components/notes/NoteCategoryModal";
import NoteFormModal from "@/components/notes/NoteFormModal";
import { useAuth } from "@/contexts/AuthContext";
import { useNoteCategories } from "@/hooks/useNoteCategories";
import { useNotes } from "@/hooks/useNotes";
import { UNCATEGORIZED_ID } from "@/lib/notes";
import type { NoteDoc } from "@/lib/types";

export default function NotesPage() {
  const { user, loading } = useAuth();
  const { notes, error: notesError, addNote, updateNote, duplicateNote, deleteNote } = useNotes(user?.uid);
  const {
    categories,
    error: categoriesError,
    addCategory,
    renameCategory,
    deleteCategory,
  } = useNoteCategories(user?.uid);

  const [selectedFilter, setSelectedFilter] = useState<string>(ALL_CATEGORIES);
  const [formOpen, setFormOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<NoteDoc | null>(null);
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);

  const categoryNameById = useMemo(() => {
    const map = new Map<string, string>();
    for (const category of categories) map.set(category.id, category.name);
    return map;
  }, [categories]);

  const categoryNameFor = (categoryId: string) => categoryNameById.get(categoryId) ?? "未分類";

  const filteredNotes = useMemo(() => {
    if (selectedFilter === ALL_CATEGORIES) return notes;
    if (selectedFilter === UNCATEGORIZED_ID) {
      return notes.filter((note) => !note.categoryId || !categoryNameById.has(note.categoryId));
    }
    return notes.filter((note) => note.categoryId === selectedFilter);
  }, [notes, selectedFilter, categoryNameById]);

  const openNewNoteForm = () => {
    setEditingNote(null);
    setFormOpen(true);
  };

  const openEditNoteForm = (note: NoteDoc) => {
    setEditingNote(note);
    setFormOpen(true);
  };

  const handleSaveNote = async (categoryId: string, text: string) => {
    if (editingNote) {
      await updateNote(editingNote.id, categoryId, text);
    } else {
      await addNote(categoryId, text);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <Header />
      <main className="mx-auto flex max-w-2xl flex-col gap-4 px-4 py-6 pb-32 sm:px-6">
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-gray-900" />
          </div>
        ) : user ? (
          <>
            {(notesError || categoriesError) && <ErrorBanner message={notesError ?? categoriesError ?? ""} />}

            <AiQuickAskBox />

            <div className="flex items-center justify-between gap-2">
              <h2 className="flex items-center gap-1.5 text-sm font-semibold text-gray-700">
                <NotebookPen className="h-4 w-4 shrink-0 text-gray-400" strokeWidth={2} />
                ノート
              </h2>
              <button
                type="button"
                onClick={openNewNoteForm}
                className="flex items-center gap-1.5 rounded-full bg-black px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-gray-800"
              >
                新規ノート
              </button>
            </div>

            <NoteCategoryFilter
              categories={categories}
              selected={selectedFilter}
              onSelect={setSelectedFilter}
              onManage={() => setCategoryModalOpen(true)}
            />

            {filteredNotes.length === 0 ? (
              <p className="py-8 text-center text-sm text-gray-400">まだノートがありません</p>
            ) : (
              <div className="flex flex-col gap-3">
                {filteredNotes.map((note) => (
                  <NoteCard
                    key={note.id}
                    note={note}
                    categoryName={categoryNameFor(note.categoryId)}
                    onEdit={() => openEditNoteForm(note)}
                    onDuplicate={() => duplicateNote(note)}
                    onDelete={() => deleteNote(note.id)}
                  />
                ))}
              </div>
            )}
          </>
        ) : (
          <LoginPrompt />
        )}
      </main>

      {formOpen && (
        <NoteFormModal
          initialNote={editingNote ?? undefined}
          initialCategoryId={selectedFilter === ALL_CATEGORIES ? undefined : selectedFilter}
          categories={categories}
          onSave={handleSaveNote}
          onManageCategories={() => setCategoryModalOpen(true)}
          onClose={() => setFormOpen(false)}
        />
      )}

      {categoryModalOpen && (
        <NoteCategoryModal
          categories={categories}
          onAdd={addCategory}
          onRename={renameCategory}
          onDelete={deleteCategory}
          onClose={() => setCategoryModalOpen(false)}
        />
      )}
    </div>
  );
}
