"use client";

import PhotoGallery from "@/components/photos/PhotoGallery";
import { useAuth } from "@/contexts/AuthContext";
import { useNoteImages } from "@/hooks/useNoteImages";

export default function NoteImages({ noteId }: { noteId: string }) {
  const { user } = useAuth();
  const { images, addImages, deleteImage } = useNoteImages(user?.uid, noteId);

  return (
    <div className="mt-3">
      <PhotoGallery photos={images} onAdd={addImages} onDelete={deleteImage} />
    </div>
  );
}
