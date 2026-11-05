"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Check, Copy, Loader2, Sparkles, X } from "lucide-react";
import LoginPrompt from "@/components/auth/LoginPrompt";
import WordSearch from "@/components/english/WordSearch";
import { useAuth } from "@/contexts/AuthContext";

// AI への問い合わせ本体（システムプロンプト・レスポンス整形）は app/api/ai-phrase/route.ts 側にある

type Mode = "generate" | "correct";

// generate: 「フレーズ生成（日→英）」、correct: 「フレーズ添削（英→日）」
type AiResult =
  | { mode: "generate"; short: string; long: string }
  | { mode: "correct"; evaluation: string; corrected: string; explanation: string };

const MODES: { key: Mode; label: string }[] = [
  { key: "generate", label: "フレーズ生成（日→英）" },
  { key: "correct", label: "フレーズ添削（英→日）" },
];

async function askAi(mode: Mode, text: string): Promise<AiResult> {
  const res = await fetch("/api/ai-phrase", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ mode, text }),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data?.error || "AIへの問い合わせに失敗しました。");
  }
  if (mode === "correct") {
    return { mode: "correct", evaluation: data.evaluation, corrected: data.corrected, explanation: data.explanation };
  }
  return { mode: "generate", short: data.short, long: data.long };
}

/**
 * 朝にさっと英語を添削するためのページ。ホームの「今週のタイムライン」下の「en」ボタンから開く。
 * 入力に集中できるよう、ヘッダー・フッターのメニューは出さず、左上の戻るボタンでホームへ帰る
 */
export default function EnglishPage() {
  const { user, loading } = useAuth();
  const [mode, setMode] = useState<Mode>("generate");
  const [textInput, setTextInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [askError, setAskError] = useState<string | null>(null);
  const [result, setResult] = useState<AiResult | null>(null);

  const handleModeChange = (nextMode: Mode) => {
    if (nextMode === mode) return;
    setMode(nextMode);
    setTextInput("");
    setAskError(null);
    setResult(null);
  };

  const handleAsk = async () => {
    const trimmed = textInput.trim();
    if (!trimmed || isLoading) return;
    setIsLoading(true);
    setAskError(null);
    setResult(null);
    try {
      setResult(await askAi(mode, trimmed));
    } catch (err) {
      console.error("[AI Phrase] 質問エラー:", err);
      setAskError(err instanceof Error ? err.message : "AIへの問い合わせに失敗しました。");
    } finally {
      setIsLoading(false);
    }
  };

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
        <h1 className="text-sm font-bold text-gray-900">英語</h1>
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
          <>
            <div className="grid grid-cols-2 gap-1 rounded-full bg-gray-200 p-1">
              {MODES.map(({ key, label }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => handleModeChange(key)}
                  className={`rounded-full py-2 text-xs font-semibold transition-colors ${
                    mode === key ? "bg-black text-white shadow-sm" : "text-gray-500 hover:text-gray-800"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            <textarea
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              placeholder={
                mode === "generate"
                  ? "例：今日は早めに寝ようと思う、を英語で言うと？"
                  : "例：I go to the gym yesterday morning."
              }
              rows={7}
              className="w-full resize-y rounded-2xl border border-gray-200 bg-white px-4 py-3 text-base leading-relaxed text-gray-900 placeholder-gray-400 outline-none focus:ring-2 focus:ring-gray-900 sm:text-sm"
            />

            <button
              type="button"
              onClick={handleAsk}
              disabled={!textInput.trim() || isLoading}
              className="flex w-full items-center justify-center gap-1.5 rounded-full bg-black py-3 text-sm font-semibold text-white transition-colors hover:bg-gray-800 disabled:bg-gray-300 disabled:text-gray-500"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {mode === "generate" ? "AIに聞いています..." : "添削しています..."}
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  {mode === "generate" ? "AIに聞く" : "添削してもらう"}
                </>
              )}
            </button>

            {askError && (
              <div className="flex items-start gap-1.5 rounded-xl bg-red-50 px-3 py-2 text-xs text-red-600">
                <X className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                <span>{askError}</span>
              </div>
            )}

            {result?.mode === "generate" && (
              <div className="flex flex-col gap-3">
                <ResultBlock label="簡単・短めのフレーズ" text={result.short} emphasize copyable />
                <ResultBlock label="少し長めのフレーズ" text={result.long} emphasize copyable />
              </div>
            )}

            {result?.mode === "correct" && (
              <div className="flex flex-col gap-4 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
                <ResultSection label="評価" text={result.evaluation} />
                <ResultSection label="修正案" text={result.corrected} emphasize copyable />
                <ResultSection label="解説・変更点" text={result.explanation} />
              </div>
            )}

            {/* フレーズを考えている途中でも単語をさっと引けるよう、英単語ページと同じ検索をここにも置く */}
            <section aria-labelledby="en-word-search-heading" className="mt-4 flex flex-col gap-3 border-t border-gray-200 pt-6">
              <h2 id="en-word-search-heading" className="px-1 text-sm font-bold text-gray-900">
                英単語を調べる
              </h2>
              <WordSearch />
            </section>
          </>
        )}
      </main>
    </div>
  );
}

function ResultBlock(props: { label: string; text: string; emphasize?: boolean; copyable?: boolean }) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
      <ResultSection {...props} />
    </div>
  );
}

function ResultSection({
  label,
  text,
  emphasize = false,
  copyable = false,
}: {
  label: string;
  text: string;
  emphasize?: boolean;
  copyable?: boolean;
}) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[11px] font-semibold text-gray-500">{label}</span>
        {copyable && <CopyButton text={text} />}
      </div>
      <p
        className={
          emphasize
            ? "break-words text-base font-semibold leading-relaxed text-gray-900"
            : "whitespace-pre-wrap text-sm leading-relaxed text-gray-700"
        }
      >
        {text}
      </p>
    </div>
  );
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch (err) {
      console.error("[AI Phrase] コピーエラー:", err);
    }
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      aria-label="コピー"
      className="flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-medium text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-800"
    >
      {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
      {copied ? "コピーしました" : "コピー"}
    </button>
  );
}
