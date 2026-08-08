import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";

export default function AiChatBar() {
  return (
    <Link
      href="/chat"
      className="flex items-center justify-center gap-2 bg-black px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-gray-800"
    >
      <Sparkles className="h-4 w-4 shrink-0" strokeWidth={2} />
      AIに相談する
      <ArrowRight className="h-3.5 w-3.5 shrink-0" strokeWidth={2} />
    </Link>
  );
}
