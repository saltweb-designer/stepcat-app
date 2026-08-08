"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { ArrowLeft, Send, Sparkles } from "lucide-react";
import ChatBubble from "@/components/chat/ChatBubble";
import { initialConversation, type ChatMessage } from "@/lib/dummy-chat";

let nextId = initialConversation.length + 1;

export default function ChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>(initialConversation);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || sending) return;

    const history = messages.map((m) => ({
      role: m.role === "ai" ? ("model" as const) : ("user" as const),
      text: m.text,
    }));

    const userMessage: ChatMessage = { id: `local-${nextId++}`, role: "user", text: trimmed };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setSending(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: trimmed, history }),
      });
      const data = await res.json();

      if (!res.ok || !data.text) {
        throw new Error(data.error ?? "応答の取得に失敗しました");
      }

      setMessages((prev) => [...prev, { id: `local-${nextId++}`, role: "ai", text: data.text }]);
    } catch (error) {
      console.error("チャット応答の取得に失敗しました", error);
      setMessages((prev) => [
        ...prev,
        {
          id: `local-${nextId++}`,
          role: "ai",
          text: "ごめんね、少し調子が悪いみたい。もう一度送ってもらえるかな？",
        },
      ]);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-gray-100">
      <header className="sticky top-0 z-30 border-b border-gray-200 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-2xl items-center gap-3 px-4 py-3 sm:px-6">
          <Link
            href="/"
            className="flex h-9 w-9 items-center justify-center rounded-full text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700"
            aria-label="ホームに戻る"
          >
            <ArrowLeft className="h-5 w-5" strokeWidth={2} />
          </Link>
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-black text-white shadow-sm">
            <Sparkles className="h-5 w-5" strokeWidth={2} />
          </span>
          <div className="leading-tight">
            <p className="text-sm font-semibold text-gray-900">AIに相談する</p>
            <p className="text-xs text-gray-500">目標やタスクについて気軽に相談できます</p>
          </div>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-3 overflow-y-auto px-4 py-5 sm:px-6">
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
      </main>

      <form
        onSubmit={handleSubmit}
        className="sticky bottom-0 border-t border-gray-200 bg-white/90 px-4 py-3 backdrop-blur-md sm:px-6"
        style={{ paddingBottom: "calc(0.75rem + env(safe-area-inset-bottom))" }}
      >
        <div className="mx-auto flex max-w-2xl items-center gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="今週の目標について相談する..."
            disabled={sending}
            className="flex-1 rounded-full border border-gray-300 bg-white px-4 py-2.5 text-base text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-black/20 disabled:opacity-60"
          />
          <button
            type="submit"
            disabled={input.trim() === "" || sending}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-black text-white transition-colors hover:bg-gray-800 disabled:cursor-not-allowed disabled:bg-gray-300"
            aria-label="送信"
          >
            <Send className="h-4 w-4" strokeWidth={2} />
          </button>
        </div>
      </form>
    </div>
  );
}
