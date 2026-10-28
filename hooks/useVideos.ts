"use client";

import { useEffect, useState } from "react";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { VideoDoc, VideoInput } from "@/lib/types";

export function useVideos(uid: string | undefined) {
  const [videos, setVideos] = useState<VideoDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!uid) return;

    const q = query(collection(db, "users", uid, "videos"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        setVideos(
          snapshot.docs.map((docSnap) => {
            const data = docSnap.data();
            return {
              id: docSnap.id,
              url: data.url ?? "",
              title: data.title ?? "",
              channelName: data.channelName ?? "",
              channelUrl: data.channelUrl ?? "",
              channelIconUrl: data.channelIconUrl ?? "",
              categoryId: data.categoryId ?? "",
              memo: data.memo ?? "",
            } satisfies VideoDoc;
          })
        );
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.error("動画の取得に失敗しました", err);
        setError(
          err.code === "permission-denied"
            ? "アクセス権限がありません。Firestoreのセキュリティルールをご確認ください。"
            : "動画の取得に失敗しました。"
        );
        setLoading(false);
      }
    );

    return unsubscribe;
  }, [uid]);

  const addVideo = async (input: VideoInput) => {
    if (!uid) return;
    await addDoc(collection(db, "users", uid, "videos"), {
      ...input,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  };

  const updateVideo = async (id: string, input: VideoInput) => {
    if (!uid) return;
    await updateDoc(doc(db, "users", uid, "videos", id), {
      ...input,
      updatedAt: serverTimestamp(),
    });
  };

  const deleteVideo = async (id: string) => {
    if (!uid) return;
    await deleteDoc(doc(db, "users", uid, "videos", id));
  };

  return uid
    ? { videos, loading, error, addVideo, updateVideo, deleteVideo }
    : {
        videos: [],
        loading: false,
        error: null,
        addVideo: async () => {},
        updateVideo: async () => {},
        deleteVideo: async () => {},
      };
}
