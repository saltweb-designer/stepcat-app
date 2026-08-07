import { Sparkles } from "lucide-react";
import type { ChatMessage } from "@/lib/dummy-chat";

export default function ChatBubble({ message }: { message: ChatMessage }) {
  const isAi = message.role === "ai";

  return (
    <div className={`flex items-end gap-2 ${isAi ? "justify-start" : "justify-end"}`}>
      {isAi && (
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-black text-white">
          <Sparkles className="h-3.5 w-3.5" strokeWidth={2} />
        </span>
      )}
      <div
        className={`max-w-[75%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed shadow-sm ${
          isAi
            ? "rounded-bl-sm bg-white text-gray-700 ring-1 ring-gray-200"
            : "rounded-br-sm bg-black text-white"
        }`}
      >
        <p className="whitespace-pre-wrap">{message.text}</p>
      </div>
    </div>
  );
}
