"use client";

import { useState } from "react";
import { HeartPulse, Pencil } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useWellness } from "@/hooks/useWellness";
import WellnessFormModal from "./WellnessFormModal";

const FLAG_LABELS: { key: "hasSwelling" | "hasTightness" | "hasFatigue" | "hasConditionChange"; label: string }[] = [
  { key: "hasSwelling", label: "むくみ" },
  { key: "hasTightness", label: "張り感" },
  { key: "hasFatigue", label: "疲労感" },
  { key: "hasConditionChange", label: "体調変化" },
];

export default function WellnessSection({ date }: { date: string }) {
  const { user } = useAuth();
  const { data, saveWellness } = useWellness(user?.uid, date);
  const [open, setOpen] = useState(false);

  const activeFlags = data ? FLAG_LABELS.filter(({ key }) => data[key]) : [];

  return (
    <div className="mb-3">
      {data ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex w-full items-start gap-2 rounded-xl bg-rose-50 px-3 py-2.5 text-left transition-colors hover:bg-rose-100"
        >
          <HeartPulse className="mt-0.5 h-4 w-4 shrink-0 text-rose-500" strokeWidth={2} />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-rose-700">
              {data.morningWeight && <span className="font-semibold">体重 {data.morningWeight}</span>}
              {data.sleepHours && <span>睡眠 {data.sleepHours}</span>}
              <span>お通じ {data.hasBowelMovement ? "あり" : "なし"}</span>
              {activeFlags.map(({ key, label }) => (
                <span key={key} className="rounded-full bg-rose-100 px-2 py-0.5 font-medium">
                  {label}
                </span>
              ))}
            </div>
          </div>
          <Pencil className="mt-0.5 h-3.5 w-3.5 shrink-0 text-rose-400" strokeWidth={2} />
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex items-center gap-1.5 rounded-full border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-500 transition-colors hover:border-gray-300 hover:text-gray-700"
        >
          <HeartPulse className="h-3.5 w-3.5" strokeWidth={2} />
          体調 登録
        </button>
      )}

      {open && (
        <WellnessFormModal
          date={date}
          initialData={data}
          onSave={saveWellness}
          onClose={() => setOpen(false)}
        />
      )}
    </div>
  );
}
