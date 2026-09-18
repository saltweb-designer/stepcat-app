"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { ChevronDown, Send, Sparkles } from "lucide-react";
import ChatBubble from "@/components/chat/ChatBubble";
import InlineAccordion from "./InlineAccordion";
import { initialConversation, type ChatMessage } from "@/lib/dummy-chat";

export default function AiQuickAskBox() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>(initialConversation);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const nextIdRef = useRef(initialConversation.length + 1);
  const inputRef = useRef<HTMLInputElement>(null);
  const wasOpenRef = useRef(false);

  useEffect(() => {
    if (!open) {
      wasOpenRef.current = false;
      return;
    }
    if (wasOpenRef.current) return;
    wasOpenRef.current = true;

    const timer = setTimeout(() => {
      inputRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 200);
    return () => clearTimeout(timer);
  }, [open]);

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
    <div className="overflow-hidden rounded-2xl bg-black shadow-sm">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="group flex w-full items-center gap-3 p-3.5 text-left"
      >
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10">
          <Sparkles className="h-5 w-5 text-white" strokeWidth={2} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-bold text-white">AIにサクッと相談する</span>
          <span className="block truncate text-xs font-semibold text-white/60">
            目標やタスクについて気軽に聞いてみよう
          </span>
        </span>
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-white/50 transition-transform ${open ? "rotate-180" : ""}`}
          strokeWidth={2}
        />
      </button>

      <InlineAccordion open={open}>
        <div className="flex max-h-[60vh] flex-col border-t border-white/10 bg-gray-50">
          <div className="flex-1 overflow-y-auto px-3.5 py-3">
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

          <form onSubmit={handleSubmit} className="shrink-0 border-t border-gray-200 bg-white px-3.5 py-3">
            <div className="flex items-center gap-2">
              <input
                ref={inputRef}
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
      </InlineAccordion>
    </div>
  );
}
