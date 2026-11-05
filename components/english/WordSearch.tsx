"use client";

import { useState } from "react";
import { Loader2, Search, Volume2, X } from "lucide-react";

// AI への問い合わせ本体（システムプロンプト・レスポンス整形）は app/api/ai-phrase/route.ts の "word" モードにある

type WordEntry = {
  word: string;
  pronunciation: string;
  partOfSpeech: string;
  meaning: string;
  example: string;
  exampleJa: string;
};

type WordResult = { direction: "en-ja" | "ja-en"; entries: WordEntry[] };

async function lookUpWord(text: string): Promise<WordResult> {
  const res = await fetch("/api/ai-phrase", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ mode: "word", text }),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data?.error || "AIへの問い合わせに失敗しました。");
  }
  return {
    direction: data.direction === "ja-en" ? "ja-en" : "en-ja",
    entries: Array.isArray(data.entries) ? data.entries : [],
  };
}

/** 英単語をブラウザの読み上げ機能で発音する（対応していない端末では何もしない） */
function speak(word: string) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(word);
  utterance.lang = "en-US";
  window.speechSynthesis.speak(utterance);
}

/**
 * 英単語の検索欄と結果。「英単語」ページ（app/word/page.tsx）と「en」ページ（app/en/page.tsx）の両方で使う。
 * 日本語を入れれば英単語の候補（日→英）、英語を入れれば日本語の意味（英→日）を AI が自動で判断して返す
 */
export default function WordSearch() {
  const [textInput, setTextInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [askError, setAskError] = useState<string | null>(null);
  const [result, setResult] = useState<WordResult | null>(null);

  const handleSearch = async () => {
    const trimmed = textInput.trim();
    if (!trimmed || isLoading) return;
    setIsLoading(true);
    setAskError(null);
    setResult(null);
    try {
      setResult(await lookUpWord(trimmed));
    } catch (err) {
      console.error("[AI Word] 検索エラー:", err);
      setAskError(err instanceof Error ? err.message : "AIへの問い合わせに失敗しました。");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClear = () => {
    setTextInput("");
    setResult(null);
    setAskError(null);
  };

  return (
    <div className="flex flex-col gap-3">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSearch();
        }}
        className="flex flex-col gap-2"
      >
        {/* iPhone で入力時に勝手に拡大されないよう、スマホでは 16px（text-base）にしておく */}
        <div className="flex items-center gap-2 rounded-full border border-gray-200 bg-white pl-4 pr-1.5 shadow-sm focus-within:ring-2 focus-within:ring-gray-900">
          <Search className="h-4 w-4 shrink-0 text-gray-400" />
          <input
            type="text"
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            placeholder="例：apple / りんご"
            enterKeyHint="search"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            className="min-w-0 flex-1 bg-transparent py-3 text-base text-gray-900 placeholder-gray-400 outline-none sm:text-sm"
          />
          {textInput && (
            <button
              type="button"
              onClick={handleClear}
              aria-label="入力を消す"
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-700"
            >
              <X className="h-4 w-4" />
            </button>
          )}
          <button
            type="submit"
            disabled={!textInput.trim() || isLoading}
            className="flex h-9 shrink-0 items-center gap-1 rounded-full bg-black px-4 text-xs font-semibold text-white transition-colors hover:bg-gray-800 disabled:bg-gray-300 disabled:text-gray-500"
          >
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "調べる"}
          </button>
        </div>
        <p className="px-2 text-[11px] text-gray-500">英語を入れると日本語の意味、日本語を入れると英単語を調べます</p>
      </form>

      {askError && (
        <div className="flex items-start gap-1.5 rounded-xl bg-red-50 px-3 py-2 text-xs text-red-600">
          <X className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span>{askError}</span>
        </div>
      )}

      {result && (
        <div className="flex flex-col gap-3">
          <span className="px-1 text-[11px] font-semibold text-gray-500">
            {result.direction === "ja-en" ? "日→英" : "英→日"}
          </span>
          {result.entries.length === 0 ? (
            <p className="rounded-2xl bg-white p-4 text-sm text-gray-500 shadow-sm">見つかりませんでした。</p>
          ) : (
            result.entries.map((entry, i) => <WordCard key={`${entry.word}-${i}`} entry={entry} />)
          )}
        </div>
      )}
    </div>
  );
}

function WordCard({ entry }: { entry: WordEntry }) {
  return (
    <div className="flex flex-col gap-2 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
        <span className="break-words text-lg font-bold text-gray-900">{entry.word}</span>
        {entry.pronunciation && <span className="text-xs text-gray-500">{entry.pronunciation}</span>}
        <button
          type="button"
          onClick={() => speak(entry.word)}
          aria-label={`${entry.word} を読み上げる`}
          className="flex h-7 w-7 items-center justify-center rounded-full text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-800"
        >
          <Volume2 className="h-4 w-4" />
        </button>
      </div>
      <div className="flex items-start gap-2">
        {entry.partOfSpeech && (
          <span className="mt-0.5 shrink-0 rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-semibold text-gray-600">
            {entry.partOfSpeech}
          </span>
        )}
        <p className="text-sm leading-relaxed text-gray-800">{entry.meaning}</p>
      </div>
      {entry.example && (
        <div className="rounded-xl bg-gray-50 px-3 py-2">
          <p className="text-sm text-gray-900">{entry.example}</p>
          {entry.exampleJa && <p className="mt-0.5 text-xs text-gray-500">{entry.exampleJa}</p>}
        </div>
      )}
    </div>
  );
}
