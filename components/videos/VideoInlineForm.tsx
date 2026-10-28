"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { Loader2, Tags } from "lucide-react";
import ChannelAvatar from "./ChannelAvatar";
import { UNCATEGORIZED_ID } from "@/lib/notes";
import { parseYouTubeUrl } from "@/lib/youtube";
import type { NoteCategoryDoc, VideoInput } from "@/lib/types";

const inputClassName =
  "w-full rounded-lg border border-gray-300 px-3 py-2 text-base text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-black/20";

interface VideoMeta {
  title: string;
  channelName: string;
  channelUrl: string;
  channelIconUrl: string;
}

export default function VideoInlineForm({
  active,
  initialVideo,
  categories,
  onSave,
  onCancel,
  onManageCategories,
  submitLabel,
}: {
  /** 親のアコーディオンが開いているかどうか。true になったタイミングでのみ初期化・フォーカスする */
  active: boolean;
  initialVideo: VideoInput;
  categories: NoteCategoryDoc[];
  /** 呼び出し側で保存処理と、成功時にアコーディオンを閉じる処理まで担う */
  onSave: (input: VideoInput) => Promise<void>;
  onCancel: () => void;
  onManageCategories: () => void;
  submitLabel: string;
}) {
  const [url, setUrl] = useState(initialVideo.url);
  const [meta, setMeta] = useState<VideoMeta>(initialVideo);
  const [categoryId, setCategoryId] = useState(initialVideo.categoryId);
  const [memo, setMemo] = useState(initialVideo.memo);
  const [fetchingMeta, setFetchingMeta] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const urlInputRef = useRef<HTMLInputElement>(null);
  const wasActiveRef = useRef(false);
  const fetchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latestRequestRef = useRef("");

  // 閉→開に切り替わった瞬間だけ初期値へリセットしてフォーカスする
  useEffect(() => {
    if (!active) {
      wasActiveRef.current = false;
      return;
    }
    if (wasActiveRef.current) return;
    wasActiveRef.current = true;

    setUrl(initialVideo.url);
    setMeta(initialVideo);
    setCategoryId(initialVideo.categoryId);
    setMemo(initialVideo.memo);
    setError(null);

    const timer = setTimeout(() => {
      urlInputRef.current?.focus();
      urlInputRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 200);
    return () => clearTimeout(timer);
  }, [active, initialVideo]);

  useEffect(() => () => {
    if (fetchTimerRef.current) clearTimeout(fetchTimerRef.current);
  }, []);

  const fetchMeta = async (videoUrl: string) => {
    latestRequestRef.current = videoUrl;
    setFetchingMeta(true);
    try {
      const res = await fetch(`/api/youtube-meta?url=${encodeURIComponent(videoUrl)}`);
      const data = await res.json();
      if (latestRequestRef.current !== videoUrl) return;
      if (!res.ok) {
        setError(data.error ?? "動画情報を取得できませんでした。チャンネル名は手入力できます。");
        return;
      }
      setMeta({
        title: data.title ?? "",
        channelName: data.channelName ?? "",
        channelUrl: data.channelUrl ?? "",
        channelIconUrl: data.channelIconUrl ?? "",
      });
      setError(null);
    } catch (err) {
      console.error("動画情報の取得に失敗しました", err);
      if (latestRequestRef.current === videoUrl) {
        setError("動画情報を取得できませんでした。チャンネル名は手入力できます。");
      }
    } finally {
      if (latestRequestRef.current === videoUrl) setFetchingMeta(false);
    }
  };

  // URL の入力が落ち着いたら、動画タイトルとチャンネル情報を自動取得する
  const handleUrlChange = (value: string) => {
    setUrl(value);
    if (fetchTimerRef.current) clearTimeout(fetchTimerRef.current);
    const trimmed = value.trim();
    if (!parseYouTubeUrl(trimmed)) {
      latestRequestRef.current = "";
      setFetchingMeta(false);
      return;
    }
    fetchTimerRef.current = setTimeout(() => fetchMeta(trimmed), 400);
  };

  const trimmedUrl = url.trim();
  const isValidUrl = parseYouTubeUrl(trimmedUrl) !== null;
  const resolvedCategoryId =
    categoryId !== UNCATEGORIZED_ID && !categories.some((c) => c.id === categoryId) ? UNCATEGORIZED_ID : categoryId;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!isValidUrl || saving) return;

    setSaving(true);
    setError(null);
    try {
      await onSave({
        url: trimmedUrl,
        title: meta.title.trim(),
        channelName: meta.channelName.trim(),
        channelUrl: meta.channelUrl,
        channelIconUrl: meta.channelIconUrl,
        categoryId: resolvedCategoryId,
        memo: memo.trim(),
      });
      setSaving(false);
    } catch (err) {
      console.error("動画の保存に失敗しました", err);
      setError("保存に失敗しました。もう一度お試しください。");
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3 pt-3">
      <div>
        <label className="mb-1.5 block text-xs font-semibold text-gray-500">YouTube URL</label>
        <input
          ref={urlInputRef}
          type="url"
          inputMode="url"
          value={url}
          onChange={(e) => handleUrlChange(e.target.value)}
          placeholder="https://www.youtube.com/watch?v=..."
          className={inputClassName}
        />
        {trimmedUrl !== "" && !isValidUrl && (
          <p className="mt-1 text-[11px] font-medium text-rose-500">YouTube の動画URLを入力してください</p>
        )}
        {meta.title && isValidUrl && <p className="mt-1.5 line-clamp-2 text-xs text-gray-500">{meta.title}</p>}
      </div>

      <div>
        <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-gray-500">
          アカウント名
          {fetchingMeta && (
            <span className="flex items-center gap-1 font-medium text-gray-400">
              <Loader2 className="h-3 w-3 animate-spin" strokeWidth={2.5} />
              取得中
            </span>
          )}
        </label>
        <div className="flex items-center gap-2">
          <ChannelAvatar name={meta.channelName} iconUrl={meta.channelIconUrl} className="h-9 w-9" />
          <input
            type="text"
            value={meta.channelName}
            onChange={(e) => setMeta((prev) => ({ ...prev, channelName: e.target.value }))}
            placeholder="URLを入れると自動で入ります"
            className={inputClassName}
          />
        </div>
      </div>

      <div>
        <div className="mb-1.5 flex items-center justify-between">
          <label className="text-xs font-semibold text-gray-500">カテゴリ</label>
          <button
            type="button"
            onClick={onManageCategories}
            className="flex items-center gap-1 text-[11px] font-semibold text-gray-400 transition-colors hover:text-gray-700"
          >
            <Tags className="h-3 w-3" strokeWidth={2} />
            カテゴリを管理
          </button>
        </div>
        <select
          value={resolvedCategoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          className={inputClassName}
        >
          <option value={UNCATEGORIZED_ID}>未分類</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
      </div>

      <textarea
        value={memo}
        onChange={(e) => setMemo(e.target.value)}
        rows={2}
        placeholder="メモ（任意）"
        className={`${inputClassName} resize-none`}
      />

      <div className="flex items-center justify-end gap-2">
        {error && <p className="mr-auto text-xs font-medium text-rose-600">{error}</p>}
        <button
          type="button"
          onClick={onCancel}
          className="rounded-full border border-gray-300 px-4 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50"
        >
          キャンセル
        </button>
        <button
          type="submit"
          disabled={!isValidUrl || saving}
          className="rounded-full bg-black px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-gray-800 disabled:cursor-not-allowed disabled:bg-gray-300"
        >
          {saving ? "保存中..." : submitLabel}
        </button>
      </div>
    </form>
  );
}
