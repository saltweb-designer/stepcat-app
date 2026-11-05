"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import LoginPrompt from "@/components/auth/LoginPrompt";
import WordSearch from "@/components/english/WordSearch";
import { useAuth } from "@/contexts/AuthContext";

/**
 * 英単語の意味をさっと調べるページ。ホームの「en」の右隣の「英単語」ボタンから開く。
 * 入力に集中できるよう、ヘッダー・フッターのメニューは出さず、左上の戻るボタンでホームへ帰る
 */
export default function WordPage() {
  const { user, loading } = useAuth();

  return (
    <div className="min-h-full bg-gray-100" style={{ paddingTop: "env(safe-area-inset-top)" }}>
      <div className="mx-auto flex max-w-2xl items-center gap-2 px-4 pt-4 sm:px-6">
        <Link
          href="/"
          aria-label="ホームへ戻る"
          className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-gray-700 shadow-sm transition-colors hover:bg-gray-50"
        >
          <ArrowLeft className="h-4 w-4" strokeWidth={2.5} />
        </Link>
        <h1 className="text-sm font-bold text-gray-900">英単語</h1>
      </div>

      <main
        className="mx-auto flex max-w-2xl flex-col gap-4 px-4 py-4 sm:px-6"
        style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 2.5rem)" }}
      >
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-gray-900" />
          </div>
        ) : !user ? (
          <LoginPrompt />
        ) : (
          <WordSearch />
        )}
      </main>
    </div>
  );
}
