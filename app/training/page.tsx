"use client";

import { Dumbbell } from "lucide-react";
import MediaLibraryPage from "@/components/videos/MediaLibraryPage";

export default function TrainingPage() {
  return (
    <MediaLibraryPage
      title="トレーニング動画"
      icon={Dumbbell}
      itemsCollection="trainingVideos"
      categoriesCollection="trainingVideoCategories"
    />
  );
}
