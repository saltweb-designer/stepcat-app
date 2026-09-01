"use client";

import { useEffect, useState, type FormEvent } from "react";
import { X } from "lucide-react";
import { EMPTY_WELLNESS, type WellnessDoc } from "@/lib/types";

function ToggleRow({
  label,
  checked,
  onChange,
  note,
  onNoteChange,
  notePlaceholder,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  note: string;
  onNoteChange: (v: string) => void;
  notePlaceholder: string;
}) {
  return (
    <div>
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-gray-500">{label}</span>
        <button
          type="button"
          role="switch"
          aria-checked={checked}
          aria-label={label}
          onClick={() => onChange(!checked)}
          className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
            checked ? "bg-black" : "bg-gray-300"
          }`}
        >
          <span
            className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
              checked ? "translate-x-5" : "translate-x-0"
            }`}
          />
        </button>
      </div>
      {checked && (
        <input
          type="text"
          value={note}
          onChange={(e) => onNoteChange(e.target.value)}
          placeholder={notePlaceholder}
          className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2 text-base text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-black/20"
        />
      )}
    </div>
  );
}

export default function WellnessFormModal({
  date,
  initialData,
  onSave,
  onClose,
}: {
  date: string;
  initialData: WellnessDoc | null;
  onSave: (data: WellnessDoc) => Promise<void>;
  onClose: () => void;
}) {
  const [form, setForm] = useState<WellnessDoc>(() => initialData ?? EMPTY_WELLNESS);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  const update = <K extends keyof WellnessDoc>(key: K, value: WellnessDoc[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (saving) return;
    setSaving(true);
    setError(null);
    try {
      await onSave(form);
      onClose();
    } catch (err) {
      console.error("体調記録の保存に失敗しました", err);
      setError("保存に失敗しました。もう一度お試しください。");
      setSaving(false);
    }
  };

  const [, m, d] = date.split("-");
  const dateLabel = `${Number(m)}月${Number(d)}日`;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm p-0 sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="wellness-form-title"
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[90vh] w-full flex-col overflow-hidden rounded-t-2xl bg-white shadow-2xl sm:max-w-lg sm:rounded-2xl"
      >
        <header className="flex shrink-0 items-center justify-between border-b border-gray-100 px-5 py-4">
          <h2 id="wellness-form-title" className="text-base font-semibold text-gray-900">
            {dateLabel}の体調記録
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
            aria-label="閉じる"
          >
            <X className="h-5 w-5" strokeWidth={2} />
          </button>
        </header>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-5 py-4">
          <div className="flex flex-col gap-5">
            <div>
              <label htmlFor="wellness-weight" className="mb-1.5 block text-xs font-semibold text-gray-500">
                朝の体重
              </label>
              <input
                id="wellness-weight"
                type="text"
                inputMode="decimal"
                value={form.morningWeight}
                onChange={(e) => update("morningWeight", e.target.value)}
                placeholder="例：52.3kg"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-base text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-black/20"
              />
            </div>

            <div className="flex items-center justify-between">
              <label htmlFor="wellness-bowel" className="text-xs font-semibold text-gray-500">
                お通じ
              </label>
              <button
                id="wellness-bowel"
                type="button"
                role="switch"
                aria-checked={form.hasBowelMovement}
                onClick={() => update("hasBowelMovement", !form.hasBowelMovement)}
                className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
                  form.hasBowelMovement ? "bg-black" : "bg-gray-300"
                }`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                    form.hasBowelMovement ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>

            <div>
              <label htmlFor="wellness-sleep" className="mb-1.5 block text-xs font-semibold text-gray-500">
                睡眠時間
              </label>
              <input
                id="wellness-sleep"
                type="text"
                value={form.sleepHours}
                onChange={(e) => update("sleepHours", e.target.value)}
                placeholder="例：7時間半"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-base text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-black/20"
              />
            </div>

            <ToggleRow
              label="むくみ"
              checked={form.hasSwelling}
              onChange={(v) => update("hasSwelling", v)}
              note={form.swellingNote}
              onNoteChange={(v) => update("swellingNote", v)}
              notePlaceholder="むくみの詳細を入力..."
            />

            <ToggleRow
              label="張り感"
              checked={form.hasTightness}
              onChange={(v) => update("hasTightness", v)}
              note={form.tightnessNote}
              onNoteChange={(v) => update("tightnessNote", v)}
              notePlaceholder="張り感の詳細を入力..."
            />

            <ToggleRow
              label="疲労感"
              checked={form.hasFatigue}
              onChange={(v) => update("hasFatigue", v)}
              note={form.fatigueNote}
              onNoteChange={(v) => update("fatigueNote", v)}
              notePlaceholder="疲労感の詳細を入力..."
            />

            <ToggleRow
              label="体調の変化"
              checked={form.hasConditionChange}
              onChange={(v) => update("hasConditionChange", v)}
              note={form.conditionChangeNote}
              onNoteChange={(v) => update("conditionChangeNote", v)}
              notePlaceholder="体調の変化の詳細を入力..."
            />
          </div>

          <div className="mt-6 flex items-center justify-end gap-2 border-t border-gray-100 pt-4">
            {error && <p className="mr-auto text-xs font-medium text-rose-600">{error}</p>}
            <button
              type="button"
              onClick={onClose}
              className="rounded-full border border-gray-300 px-4 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50"
            >
              キャンセル
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-full bg-black px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-gray-800 disabled:cursor-not-allowed disabled:bg-gray-300"
            >
              {saving ? "保存中..." : "保存"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
