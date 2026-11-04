"use client";

import { useEffect, useRef, useState } from "react";
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
import { parseYouTubeUrl } from "@/lib/youtube";

/**
 * 同じ YouTube 動画（URLの書き方が違っても動画IDが同じもの）が複数登録されていたら、
 * 残す1件以外の id を返す。ピン留め → メモあり → 先に登録したもの、の順で残す方を選ぶ。
 * videos は新しい順に並んでいる前提
 */
function findDuplicateIds(videos: VideoDoc[]): string[] {
  const groups = new Map<string, VideoDoc[]>();
  for (const video of videos) {
    const videoId = parseYouTubeUrl(video.url)?.id;
    if (!videoId) continue;
    groups.set(videoId, [...(groups.get(videoId) ?? []), video]);
  }
  const duplicateIds: string[] = [];
  for (const group of groups.values()) {
    if (group.length < 2) continue;
    const score = (video: VideoDoc) => (video.pinned ? 2 : 0) + (video.memo ? 1 : 0);
    // 新しい順なので、同点なら後ろ（古い方）を残す
    const keep = group.reduce((best, video) => (score(video) >= score(best) ? video : best));
    for (const video of group) if (video.id !== keep.id) duplicateIds.push(video.id);
  }
  return duplicateIds;
}

/** 動画ページは videos、音楽ページは music、トレーニング動画ページは trainingVideos に保存し、互いに混ざらないようにする */
export type MediaCollection = "videos" | "music" | "trainingVideos";

export function useVideos(uid: string | undefined, collectionName: MediaCollection = "videos") {
  const [videos, setVideos] = useState<VideoDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // 削除を依頼済みの重複動画。スナップショットが何度届いても同じ削除を繰り返さない
  const deletingDuplicateIdsRef = useRef(new Set<string>());

  useEffect(() => {
    if (!uid) return;

    const q = query(collection(db, "users", uid, collectionName), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const items = snapshot.docs.map((docSnap) => {
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
            pinned: data.pinned ?? false,
          } satisfies VideoDoc;
        });

        // すでに重複して登録されている動画は、1件だけ残して自動で削除する
        // 書き込み途中のスナップショットでは削除せず、表示から外すだけにする
        const duplicateIds = findDuplicateIds(items);
        const duplicateIdSet = new Set(duplicateIds);
        for (const id of snapshot.metadata.hasPendingWrites ? [] : duplicateIds) {
          if (deletingDuplicateIdsRef.current.has(id)) continue;
          deletingDuplicateIdsRef.current.add(id);
          deleteDoc(doc(db, "users", uid, collectionName, id)).catch((err) => {
            console.error("重複した動画の削除に失敗しました", err);
            deletingDuplicateIdsRef.current.delete(id);
          });
        }

        setVideos(items.filter((video) => !duplicateIdSet.has(video.id)));
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
  }, [uid, collectionName]);

  const addVideo = async (input: VideoInput) => {
    if (!uid) return;
    await addDoc(collection(db, "users", uid, collectionName), {
      ...input,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  };

  const updateVideo = async (id: string, input: VideoInput) => {
    if (!uid) return;
    await updateDoc(doc(db, "users", uid, collectionName, id), {
      ...input,
      updatedAt: serverTimestamp(),
    });
  };

  const setVideoPinned = async (id: string, pinned: boolean) => {
    if (!uid) return;
    await updateDoc(doc(db, "users", uid, collectionName, id), { pinned });
  };

  const deleteVideo = async (id: string) => {
    if (!uid) return;
    await deleteDoc(doc(db, "users", uid, collectionName, id));
  };

  return uid
    ? { videos, loading, error, addVideo, updateVideo, setVideoPinned, deleteVideo }
    : {
        videos: [],
        loading: false,
        error: null,
        addVideo: async () => {},
        updateVideo: async () => {},
        setVideoPinned: async () => {},
        deleteVideo: async () => {},
      };
}
