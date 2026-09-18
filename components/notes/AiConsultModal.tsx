"use client";

import { useRef, useState, type FormEvent } from "react";
import { Send, Sparkles, X } from "lucide-react";
import ChatBubble from "@/components/chat/ChatBubble";
import { initialConversation, type ChatMessage } from "@/lib/dummy-chat";

export default function AiConsultModal({ onClose }: { onClose: () => void }) {
  const [messages, setMessages] = useState<ChatMessage[]>(initialConversation);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const nextIdRef = useRef(initialConversation.length + 1);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || sending) return;

    const history = messages.map((m) => ({
      role: m.role === "ai" ? ("model" as const) : ("user" as const),
      text: m.text,
    }));

    const userMessage: ChatMessage = { id: `local-${nextIdRef.current++}`, role: "user", text: trimmed };
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

      setMessages((prev) => [...prev, { id: `local-${nextIdRef.current++}`, role: "ai", text: data.text }]);
    } catch (error) {
      console.error("チャット応答の取得に失敗しました", error);
      setMessages((prev) => [
        ...prev,
        {
          id: `local-${nextIdRef.current++}`,
          role: "ai",
          text: "ごめんね、少し調子が悪いみたい。もう一度送ってもらえるかな？",
        },
      ]);
    } finally {
      setSending(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm p-0 sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="ai-consult-title"
        onClick={(e) => e.stopPropagation()}
        className="flex h-[85vh] w-full flex-col overflow-hidden rounded-t-2xl bg-gray-100 shadow-2xl sm:h-[80vh] sm:max-w-lg sm:rounded-2xl"
      >
        <header className="flex shrink-0 items-center gap-3 border-b border-gray-200 bg-white px-4 py-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-black text-white shadow-sm">
            <Sparkles className="h-5 w-5" strokeWidth={2} />
          </span>
          <div className="min-w-0 flex-1 leading-tight">
            <p id="ai-consult-title" className="text-sm font-semibold text-gray-900">
              AIに相談する
            </p>
            <p className="text-xs text-gray-500">目標やタスクについて気軽に相談できます</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
            aria-label="閉じる"
          >
            <X className="h-5 w-5" strokeWidth={2} />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto px-4 py-4">
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
          </div>
        </div>

        <form onSubmit={handleSubmit} className="shrink-0 border-t border-gray-200 bg-white px-4 py-3">
          <div className="flex items-center gap-2">
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
    </div>
  );
}
