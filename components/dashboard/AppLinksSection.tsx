"use client";

import { useState } from "react";
import { Check, ExternalLink, Pencil, Plus } from "lucide-react";
import AppIcon from "./AppIcon";
import AppLinkFormModal from "./AppLinkFormModal";
import ErrorBanner from "./ErrorBanner";
import { useAuth } from "@/contexts/AuthContext";
import { useAppLinks } from "@/hooks/useAppLinks";
import { getHostname } from "@/lib/app-links";
import { externalApps } from "@/lib/dummy-data";
import type { AppLinkDoc } from "@/lib/types";

/** スマホではアイコンのみのタイル、sm 以上ではアイコン＋タイトルのカードとして表示する */
const tileClassName =
  "group relative block min-w-0 sm:flex sm:items-center sm:gap-3 sm:rounded-2xl sm:bg-black sm:p-3.5 sm:shadow-sm sm:transition-all sm:hover:-translate-y-0.5 sm:hover:shadow-md";
const iconFrameClassName =
  "relative block aspect-square w-full overflow-hidden rounded-2xl bg-black shadow-sm transition-transform group-active:scale-95 sm:h-11 sm:w-11 sm:shrink-0 sm:rounded-xl sm:bg-white/10 sm:shadow-none";

function TileText({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <span className="hidden min-w-0 flex-1 sm:block">
      <span className="block truncate text-sm font-bold text-white">{title}</span>
      <span className="block truncate text-xs font-semibold text-white/70">{subtitle}</span>
    </span>
  );
}

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

      <div className="grid grid-cols-5 gap-3 sm:grid-cols-2">
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
            <TileText title={app.name} subtitle={app.description} />
            <ExternalLink className="hidden h-4 w-4 shrink-0 text-white/50 transition-colors group-hover:text-white sm:block" strokeWidth={2} />
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
              <span className={`${iconFrameClassName} ring-2 ring-black/80 ring-offset-2 ring-offset-gray-100 sm:ring-0`}>
                <AppIcon name={app.name} href={app.href} iconSrc={app.iconUrl} />
              </span>
              <TileText title={app.name} subtitle={getHostname(app.href)} />
              <span className="absolute -right-1.5 -top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-white text-gray-700 shadow ring-1 ring-gray-200 sm:static sm:h-7 sm:w-7 sm:shrink-0 sm:bg-white/15 sm:text-white sm:shadow-none sm:ring-0">
                <Pencil className="h-3 w-3 sm:h-3.5 sm:w-3.5" strokeWidth={2.5} />
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
              <TileText title={app.name} subtitle={getHostname(app.href)} />
              <ExternalLink className="hidden h-4 w-4 shrink-0 text-white/50 transition-colors group-hover:text-white sm:block" strokeWidth={2} />
            </a>
          )
        )}

        <button
          type="button"
          onClick={() => setForm({ mode: "add" })}
          aria-label="関連アプリを追加"
          title="関連アプリを追加"
          className="group flex aspect-square w-full items-center justify-center rounded-2xl border-2 border-dashed border-gray-300 text-gray-400 transition-colors hover:border-gray-400 hover:text-gray-600 sm:aspect-auto sm:min-h-[4.5rem] sm:gap-2"
        >
          <Plus className="h-5 w-5" strokeWidth={2.5} />
          <span className="hidden text-sm font-semibold sm:inline">アプリを追加</span>
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
