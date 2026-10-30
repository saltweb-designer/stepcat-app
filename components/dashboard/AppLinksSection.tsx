"use client";

import { useRef, useState, type PointerEvent } from "react";
import Link from "next/link";
import { Check, Pencil, Plus } from "lucide-react";
import AppIcon from "./AppIcon";
import AppLinkFormModal from "./AppLinkFormModal";
import ErrorBanner from "./ErrorBanner";
import { useAuth } from "@/contexts/AuthContext";
import { useAppLinks } from "@/hooks/useAppLinks";
import { isInternalPath } from "@/lib/app-links";
import type { AppLinkDoc } from "@/lib/types";

/** 画面幅にかかわらずアイコンのみのタイルとして表示する。スマホは約44px、sm 以上は約60px で左から並べる */
const tileClassName = "group relative block w-11 shrink-0 sm:w-[3.75rem]";
const iconFrameClassName =
  "relative block aspect-square w-full overflow-hidden rounded-xl bg-black shadow-sm transition-transform group-active:scale-95 sm:rounded-2xl";

type FormState = { mode: "add" } | { mode: "edit"; app: AppLinkDoc } | null;

/** これ以上指が動いたらタップではなくドラッグとみなす（px） */
const DRAG_THRESHOLD = 6;

export default function AppLinksSection() {
  const { user } = useAuth();
  const { appLinks, error, addAppLink, updateAppLink, deleteAppLink, reorderAppLinks } = useAppLinks(user?.uid);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<FormState>(null);
  /** ドラッグ中の並び順（id の配列）。ドラッグしていないときは null */
  const [draftOrder, setDraftOrder] = useState<string[] | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const dragRef = useRef<{ id: string; x: number; y: number; moved: boolean } | null>(null);
  const suppressClickRef = useRef(false);
  const isEditing = editing && appLinks.length > 0;

  const displayedApps = draftOrder
    ? draftOrder.flatMap((id) => appLinks.find((a) => a.id === id) ?? [])
    : appLinks;

  const handlePointerDown = (e: PointerEvent<HTMLButtonElement>, id: string) => {
    if (e.button !== 0) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    dragRef.current = { id, x: e.clientX, y: e.clientY, moved: false };
  };

  const handlePointerMove = (e: PointerEvent<HTMLButtonElement>) => {
    const drag = dragRef.current;
    if (!drag) return;
    if (!drag.moved) {
      if (Math.hypot(e.clientX - drag.x, e.clientY - drag.y) < DRAG_THRESHOLD) return;
      drag.moved = true;
      setDraggingId(drag.id);
      setDraftOrder(appLinks.map((a) => a.id));
    }
    const target = document
      .elementFromPoint(e.clientX, e.clientY)
      ?.closest<HTMLElement>("[data-app-link-id]")?.dataset.appLinkId;
    if (!target || target === drag.id) return;
    setDraftOrder((prev) => {
      if (!prev) return prev;
      const next = prev.filter((id) => id !== drag.id);
      next.splice(prev.indexOf(target), 0, drag.id);
      return next;
    });
  };

  const handlePointerEnd = async () => {
    const drag = dragRef.current;
    dragRef.current = null;
    if (!drag?.moved) return;
    suppressClickRef.current = true;
    setDraggingId(null);
    const order = draftOrder;
    try {
      if (order && order.some((id, i) => id !== appLinks[i]?.id)) await reorderAppLinks(order);
    } catch (err) {
      console.error("関連アプリの並び替えに失敗しました", err);
    } finally {
      setDraftOrder(null);
    }
  };

  return (
    <section aria-label="関連アプリ">
      {isEditing && (
        <p className="mb-2 text-xs text-gray-400">ドラッグで並び替え・タップで編集／削除</p>
      )}

      {error && (
        <div className="mb-2">
          <ErrorBanner message={error} />
        </div>
      )}

      <div className="flex items-start gap-2">
        {/* ふだんは横にスクロールして選ぶ。編集中はドラッグしやすいよう折り返して全部を並べる */}
        <div
          className={`flex min-w-0 flex-1 gap-2.5 py-1 sm:gap-3 ${
            isEditing
              ? "flex-wrap"
              : "-ml-4 overflow-x-auto pl-4 [scrollbar-width:none] sm:-ml-6 sm:pl-6 [&::-webkit-scrollbar]:hidden"
          }`}
        >
          {displayedApps.map((app) =>
            isEditing ? (
              <button
                key={app.id}
                type="button"
                data-app-link-id={app.id}
                onPointerDown={(e) => handlePointerDown(e, app.id)}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerEnd}
                onPointerCancel={handlePointerEnd}
                onClick={() => {
                  if (suppressClickRef.current) {
                    suppressClickRef.current = false;
                    return;
                  }
                  setForm({ mode: "edit", app });
                }}
                aria-label={`${app.name}を編集`}
                className={`${tileClassName} touch-none select-none text-left transition-transform ${
                  draggingId === app.id ? "z-10 scale-110 opacity-80" : ""
                }`}
              >
                <span className={`${iconFrameClassName} pointer-events-none ring-2 ring-black/80 ring-offset-2 ring-offset-gray-100`}>
                  <AppIcon name={app.name} href={app.href} iconSrc={app.iconUrl} />
                </span>
                <span className="pointer-events-none absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-white text-gray-700 shadow ring-1 ring-gray-200">
                  <Pencil className="h-3 w-3" strokeWidth={2.5} />
                </span>
              </button>
            ) : isInternalPath(app.href) ? (
              <Link key={app.id} href={app.href} title={app.name} aria-label={app.name} className={tileClassName}>
                <span className={iconFrameClassName}>
                  <AppIcon name={app.name} href={app.href} iconSrc={app.iconUrl} />
                </span>
              </Link>
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
            className="group flex aspect-square w-11 shrink-0 items-center justify-center rounded-xl border-2 border-dashed border-gray-300 text-gray-400 transition-colors hover:border-gray-400 hover:text-gray-600 sm:w-[3.75rem] sm:rounded-2xl"
          >
            <Plus className="h-4 w-4 sm:h-5 sm:w-5" strokeWidth={2.5} />
          </button>
        </div>

        {appLinks.length > 0 && (
          <button
            type="button"
            onClick={() => setEditing((v) => !v)}
            className="mt-1 flex h-11 shrink-0 flex-col items-center justify-center gap-0.5 rounded-xl px-1.5 text-[10px] font-semibold text-gray-500 transition-colors hover:bg-gray-200 sm:h-[3.75rem]"
          >
            {isEditing ? <Check className="h-3.5 w-3.5" strokeWidth={2.5} /> : <Pencil className="h-3.5 w-3.5" strokeWidth={2} />}
            {isEditing ? "完了" : "編集"}
          </button>
        )}
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
