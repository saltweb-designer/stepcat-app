import Image from "next/image";
import { ExternalLink } from "lucide-react";
import { externalApps } from "@/lib/dummy-data";

export default function AppLinksSection() {
  return (
    <section aria-labelledby="app-links-heading">
      <h2 id="app-links-heading" className="mb-2 text-sm font-semibold text-gray-700">
        関連アプリ
      </h2>
      <div className="grid grid-cols-2 gap-3">
        {externalApps.map((app) => (
          <a
            key={app.id}
            href={app.href}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-center gap-3 rounded-2xl bg-black p-3.5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
          >
            <span className="relative h-11 w-11 shrink-0 overflow-hidden rounded-xl bg-white/10">
              <Image src={app.iconSrc} alt="" fill sizes="44px" className="object-cover" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-bold text-white sm:hidden">{app.shortLabel}</span>
              <span className="hidden truncate text-sm font-bold text-white sm:block">{app.name}</span>
              <span className="hidden truncate text-xs font-semibold text-white/70 sm:block">{app.description}</span>
            </span>
            <ExternalLink className="hidden h-4 w-4 shrink-0 text-white/50 transition-colors group-hover:text-white sm:block" strokeWidth={2} />
          </a>
        ))}
      </div>
    </section>
  );
}
