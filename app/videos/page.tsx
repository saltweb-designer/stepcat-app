"use client";

import { MonitorPlay } from "lucide-react";
import MediaLibraryPage from "@/components/videos/MediaLibraryPage";

export default function VideosPage() {
  return (
    <MediaLibraryPage title="動画" icon={MonitorPlay} itemsCollection="videos" categoriesCollection="videoCategories" shuffleDaily />
  );
}
