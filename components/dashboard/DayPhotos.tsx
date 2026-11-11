"use client";

import PhotoGallery from "@/components/photos/PhotoGallery";
import { useAuth } from "@/contexts/AuthContext";
import { useDayPhotos } from "@/hooks/useDayPhotos";

export default function DayPhotos({ date }: { date: string }) {
  const { user } = useAuth();
  const { photos, addPhotos, deletePhoto } = useDayPhotos(user?.uid, date);

  return (
    <div className="mb-3">
      <PhotoGallery photos={photos} onAdd={addPhotos} onDelete={deletePhoto} />
    </div>
  );
}
