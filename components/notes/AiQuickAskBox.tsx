"use client";

import { useState } from "react";
import { ChevronRight, Sparkles } from "lucide-react";
import AiConsultModal from "./AiConsultModal";

export default function AiQuickAskBox() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="group flex w-full items-center gap-3 rounded-2xl bg-black p-3.5 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
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
        <ChevronRight
          className="h-4 w-4 shrink-0 text-white/50 transition-transform group-hover:translate-x-0.5"
          strokeWidth={2}
        />
      </button>

      {open && <AiConsultModal onClose={() => setOpen(false)} />}
    </>
  );
}
