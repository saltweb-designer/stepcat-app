"use client";

import { useState } from "react";
import { Check, Pencil, Plus } from "lucide-react";
import AppIcon from "./AppIcon";
import AppLinkFormModal from "./AppLinkFormModal";
import ErrorBanner from "./ErrorBanner";
import { useAuth } from "@/contexts/AuthContext";
import { useAppLinks } from "@/hooks/useAppLinks";
import { externalApps } from "@/lib/dummy-data";
import type { AppLinkDoc } from "@/lib/types";

/** 画面幅にかかわらずアイコンのみのタイルとして表示する。sm 以上はスマホと同じ大きさ（約60px）で左から並べる */
const tileClassName = "group relative block min-w-0";
const iconFrameClassName =
  "relative block aspect-square w-full overflow-hidden rounded-2xl bg-black shadow-sm transition-transform group-active:scale-95";

type FormState = { mode: "add" } | { mode: "edit"; app: AppLinkDoc } | null;

export default function AppLinksSection() {
  const { user } = useAuth();
  const { appLinks, error, addAppLink, updateAppLink, deleteAppLink } = useAppLinks(user?.uid);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<FormState>(null);
  const isEditing = editing && appLinks.length > 0;

  return (
    <section aria-labelledby="app-links-heading">
      <div className="mb-2 flex items-center justify-between">
        <h2 id="app-links-heading" className="text-sm font-semibold text-gray-700">
          関連アプリ
        </h2>
        {appLinks.length > 0 && (
          <button
            type="button"
            onClick={() => setEditing((v) => !v)}
            className="flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold text-gray-500 transition-colors hover:bg-gray-200"
          >
            {isEditing ? <Check className="h-3.5 w-3.5" strokeWidth={2.5} /> : <Pencil className="h-3.5 w-3.5" strokeWidth={2} />}
            {isEditing ? "完了" : "編集"}
          </button>
        )}
      </div>

      {error && (
        <div className="mb-2">
          <ErrorBanner message={error} />
        </div>
      )}

      <div className="grid grid-cols-5 gap-3 sm:grid-cols-[repeat(auto-fill,3.75rem)]">
        {externalApps.map((app) => (
          <a
            key={app.id}
            href={app.href}
            target="_blank"
            rel="noopener noreferrer"
            title={app.name}
            aria-label={app.name}
            className={`${tileClassName} ${isEditing ? "opacity-40" : ""}`}
          >
            <span className={iconFrameClassName}>
              <AppIcon name={app.name} href={app.href} iconSrc={app.iconSrc} localIcon />
            </span>
          </a>
        ))}

        {appLinks.map((app) =>
          isEditing ? (
            <button
              key={app.id}
              type="button"
              onClick={() => setForm({ mode: "edit", app })}
              aria-label={`${app.name}を編集`}
              className={`${tileClassName} text-left`}
            >
              <span className={`${iconFrameClassName} ring-2 ring-black/80 ring-offset-2 ring-offset-gray-100`}>
                <AppIcon name={app.name} href={app.href} iconSrc={app.iconUrl} />
              </span>
              <span className="absolute -right-1.5 -top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-white text-gray-700 shadow ring-1 ring-gray-200">
                <Pencil className="h-3 w-3" strokeWidth={2.5} />
              </span>
            </button>
          ) : (
            <a
              key={app.id}
              href={app.href}
              target="_blank"
              rel="noopener noreferrer"
              title={app.name}
              aria-label={app.name}
              className={tileClassName}
            >
              <span className={iconFrameClassName}>
                <AppIcon name={app.name} href={app.href} iconSrc={app.iconUrl} />
              </span>
            </a>
          )
        )}

        <button
          type="button"
          onClick={() => setForm({ mode: "add" })}
          aria-label="関連アプリを追加"
          title="関連アプリを追加"
          className="group flex aspect-square w-full items-center justify-center rounded-2xl border-2 border-dashed border-gray-300 text-gray-400 transition-colors hover:border-gray-400 hover:text-gray-600"
        >
          <Plus className="h-5 w-5" strokeWidth={2.5} />
        </button>
      </div>

      {form && (
        <AppLinkFormModal
          initialApp={form.mode === "edit" ? form.app : undefined}
          onSave={(input) => (form.mode === "edit" ? updateAppLink(form.app.id, input) : addAppLink(input))}
          onDelete={form.mode === "edit" ? () => deleteAppLink(form.app.id) : undefined}
          onClose={() => setForm(null)}
        />
      )}
    </section>
  );
}
