"use client";

import { Dumbbell } from "lucide-react";
import MediaLibraryPage from "@/components/videos/MediaLibraryPage";

export default function TrainingPage() {
  return (
    <MediaLibraryPage
      title="筋トレ"
      icon={Dumbbell}
      itemsCollection="trainingVideos"
      categoriesCollection="trainingVideoCategories"
    />
  );
}
