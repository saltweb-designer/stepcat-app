"use client";

import { Music } from "lucide-react";
import MediaLibraryPage from "@/components/videos/MediaLibraryPage";

export default function MusicPage() {
  return <MediaLibraryPage title="音楽" icon={Music} itemsCollection="music" categoriesCollection="musicCategories" shuffleDaily />;
}
