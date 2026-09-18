import type { ReactNode } from "react";

/** 高さをアニメーションさせながら展開・折りたたみするラッパー。中身は開閉に関わらず常にマウントする */
export default function InlineAccordion({ open, children }: { open: boolean; children: ReactNode }) {
  return (
    <div
      aria-hidden={!open}
      className={`grid transition-[grid-template-rows] duration-300 ease-in-out ${
        open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
      }`}
    >
      <div className="overflow-hidden">{children}</div>
    </div>
  );
}
