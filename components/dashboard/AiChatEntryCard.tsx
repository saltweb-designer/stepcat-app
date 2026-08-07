import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";

export default function AiChatEntryCard() {
  return (
    <Link
      href="/chat"
      className="group relative flex items-center gap-3 overflow-hidden rounded-2xl bg-[#4f4f4f] p-4 text-white shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md sm:p-5"
    >
      <div className="min-w-0 flex-1">
        <span className="block text-sm font-bold">AIに相談する</span>
        <span className="mt-0.5 block text-xs font-semibold leading-relaxed text-white/80">
          目標の立て方やタスクの進め方について、AIに気軽に相談できます
        </span>
        <span className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-white">
          相談を始める
          <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" strokeWidth={2} />
        </span>
      </div>
      <div className="relative h-20 w-24 shrink-0 sm:h-24 sm:w-28">
        <Image
          src="/home_ai.png"
          alt=""
          fill
          sizes="112px"
          className="object-contain object-bottom"
        />
      </div>
    </Link>
  );
}
