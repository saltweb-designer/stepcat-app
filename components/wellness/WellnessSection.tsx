"use client";

import { useEffect, useRef, useState, type MouseEvent } from "react";
import { Check, Copy, HeartPulse, Pencil } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useWellness } from "@/hooks/useWellness";
import { formatSleepDuration, type WellnessDoc } from "@/lib/types";
import WellnessFormModal from "./WellnessFormModal";

const NOTE_FIELDS: {
  flagKey: "hasSwelling" | "hasTightness" | "hasFatigue" | "hasConditionChange";
  noteKey: "swellingNote" | "tightnessNote" | "fatigueNote" | "conditionChangeNote";
  label: string;
}[] = [
  { flagKey: "hasSwelling", noteKey: "swellingNote", label: "むくみ" },
  { flagKey: "hasTightness", noteKey: "tightnessNote", label: "張り感" },
  { flagKey: "hasFatigue", noteKey: "fatigueNote", label: "疲労感" },
  { flagKey: "hasConditionChange", noteKey: "conditionChangeNote", label: "体調の変化" },
];

function buildSummaryLines(data: WellnessDoc): { label: string; value: string }[] {
  const lines: { label: string; value: string }[] = [];
  if (data.morningWeight) lines.push({ label: "体重", value: data.morningWeight });
  const sleepLabel = formatSleepDuration(data.sleepHours);
  if (sleepLabel) lines.push({ label: "睡眠時間", value: sleepLabel });
  lines.push({ label: "お通じ", value: data.hasBowelMovement ? "あり" : "なし" });
  for (const { flagKey, noteKey, label } of NOTE_FIELDS) {
    if (data[flagKey]) lines.push({ label, value: data[noteKey] || "あり" });
  }
  return lines;
}

export default function WellnessSection({ date }: { date: string }) {
  const { user } = useAuth();
  const { data, saveWellness } = useWellness(user?.uid, date);
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const copyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current);
    };
  }, []);

  const summaryLines = data ? buildSummaryLines(data) : [];

  const handleCopy = async (e: MouseEvent) => {
    e.stopPropagation();
    const text = summaryLines.map(({ label, value }) => `${label}：${value}`).join("\n");
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current);
      copyTimeoutRef.current = setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("体調記録のコピーに失敗しました", err);
    }
  };

  return (
    <div className="mb-3">
      {data ? (
        <div className="relative rounded-xl bg-rose-50 px-3 py-2.5">
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="flex w-full items-start gap-2 pr-7 text-left"
          >
            <HeartPulse className="mt-0.5 h-4 w-4 shrink-0 text-rose-500" strokeWidth={2} />
            <div className="flex min-w-0 flex-1 flex-col gap-1">
              {summaryLines.map(({ label, value }) => (
                <p key={label} className="text-xs text-rose-700">
                  <span className="font-semibold">{label}：</span>
                  {value}
                </p>
              ))}
            </div>
            <Pencil className="mt-0.5 h-3.5 w-3.5 shrink-0 text-rose-400" strokeWidth={2} />
          </button>
          <button
            type="button"
            onClick={handleCopy}
            aria-label={copied ? "コピーしました" : "記録をコピー"}
            title={copied ? "コピーしました" : "記録をコピー"}
            className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full text-rose-400 transition-colors hover:bg-rose-100 hover:text-rose-600"
          >
            {copied ? (
              <Check className="h-3.5 w-3.5 text-emerald-600" strokeWidth={2.5} />
            ) : (
              <Copy className="h-3.5 w-3.5" strokeWidth={2} />
            )}
          </button>
        </div>
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
