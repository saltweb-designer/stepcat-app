"use client";

import { useState } from "react";
import { HeartPulse } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useWellness } from "@/hooks/useWellness";
import { toIsoDate } from "@/lib/week";
import WellnessFormModal from "./WellnessFormModal";

export default function AddWellnessButton() {
  const { user } = useAuth();
  const todayIso = toIsoDate(new Date());
  const { data, saveWellness } = useWellness(user?.uid, todayIso);
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex flex-1 items-center justify-center gap-2 bg-rose-500 px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-rose-600"
      >
        <HeartPulse className="h-4 w-4 shrink-0" strokeWidth={2.5} />
        体調登録
      </button>

      {open && (
        <WellnessFormModal
          date={todayIso}
          initialData={data}
          onSave={saveWellness}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}
