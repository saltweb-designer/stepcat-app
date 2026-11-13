"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { RotateCcw, Send, Sparkles } from "lucide-react";
import ChatBubble from "@/components/chat/ChatBubble";
import type { ChatMessage } from "@/lib/dummy-chat";

/** 入力欄の上に出す質問例。押すとそのまま質問として送る */
const SUGGESTIONS = [
  "ジャガイモの消化時間は？",
  "トレーニング前に食べるなら何がいい？",
  "タンパク質が多い食材は？",
  "寝る前に食べても太りにくいものは？",
];

/**
 * ボディーメイク・食事について AI にさっと聞くチャット。AI ページ（app/ai/page.tsx）で使う。
 * その場で聞くだけの用途なので、会話は保存せずページを閉じると消える
 */
export default function BodyMakeAsk() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const nextIdRef = useRef(1);
  const bottomRef = useRef<HTMLDivElement>(null);

  // 新しい質問・返答が増えたら一番下までスクロールする
  useEffect(() => {
    if (messages.length === 0) return;
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, sending]);

  const ask = async (question: string) => {
    const trimmed = question.trim();
    if (!trimmed || sending) return;

    const history = messages.map((m) => ({
      role: m.role === "ai" ? ("model" as const) : ("user" as const),
      text: m.text,
    }));

    setMessages((prev) => [...prev, { id: `m-${nextIdRef.current++}`, role: "user", text: trimmed }]);
    setInput("");
    setSending(true);

    try {
      const res = await fetch("/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: trimmed, history }),
      });
      const data = await res.json();
      if (!res.ok || !data.text) throw new Error(data.error ?? "返答の取得に失敗しました");

      setMessages((prev) => [...prev, { id: `m-${nextIdRef.current++}`, role: "ai", text: data.text }]);
    } catch (error) {
      console.error("AIの返答の取得に失敗しました", error);
      setMessages((prev) => [
        ...prev,
        {
          id: `m-${nextIdRef.current++}`,
          role: "ai",
          text: error instanceof Error && error.message ? error.message : "うまく答えられませんでした。もう一度送ってください。",
        },
      ]);
    } finally {
      setSending(false);
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    ask(input);
  };

  return (
    <div className="flex flex-col gap-4">
      {messages.length === 0 ? (
        <div className="rounded-2xl bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-black text-white">
              <Sparkles className="h-3.5 w-3.5" strokeWidth={2} />
            </span>
            <p className="text-sm font-bold text-gray-900">ボディーメイク・食事のことを聞いてみよう</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => ask(s)}
                className="rounded-full border border-gray-300 bg-white px-3 py-1.5 text-xs font-bold text-gray-700 transition-colors hover:bg-gray-50"
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {messages.map((message) => (
            <ChatBubble key={message.id} message={message} />
          ))}
          {sending && (
            <div className="flex items-end gap-2">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-black text-white">
                <Sparkles className="h-3.5 w-3.5" strokeWidth={2} />
              </span>
              <div className="flex items-center gap-1 rounded-2xl rounded-bl-sm bg-white px-4 py-3 shadow-sm ring-1 ring-gray-200">
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-gray-400 [animation-delay:-0.3s]" />
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-gray-400 [animation-delay:-0.15s]" />
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-gray-400" />
              </div>
            </div>
          )}
          {!sending && (
            <button
              type="button"
              onClick={() => setMessages([])}
              className="flex items-center gap-1 self-center text-xs font-bold text-gray-500 hover:text-gray-700"
            >
              <RotateCcw className="h-3 w-3" strokeWidth={2.5} />
              新しい質問にする
            </button>
          )}
          <div ref={bottomRef} />
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex items-center gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="例：ジャガイモの消化時間は？"
          disabled={sending}
          enterKeyHint="send"
          className="min-w-0 flex-1 rounded-full border border-gray-300 bg-white px-4 py-2.5 text-base text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-black/20 disabled:opacity-60"
        />
        <button
          type="submit"
          disabled={input.trim() === "" || sending}
          aria-label="送信"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-black text-white transition-colors hover:bg-gray-800 disabled:cursor-not-allowed disabled:bg-gray-300"
        >
          <Send className="h-4 w-4" strokeWidth={2} />
        </button>
      </form>
    </div>
  );
}
