"use client";

import { useState } from "react";
import { Scale } from "lucide-react";
import { toIsoDate } from "@/lib/week";
import ActionLogModal from "./ActionLogModal";

export default function AddActionLogButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex flex-1 items-center justify-center gap-2 bg-emerald-600 px-2 py-2.5 text-sm font-bold text-white transition-colors hover:bg-emerald-700"
      >
        <Scale className="h-4 w-4 shrink-0" strokeWidth={2.5} />
        行動の起点
      </button>

      {open && <ActionLogModal date={toIsoDate(new Date())} onClose={() => setOpen(false)} />}
    </>
  );
}
