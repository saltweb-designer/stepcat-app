import { Link2, MapPin } from "lucide-react";
import type { LinkItem } from "@/lib/types";

export default function LinkChips({ links }: { links: LinkItem[] }) {
  if (links.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1.5">
      {links.map((link) => (
        <a
          key={link.id}
          href={link.href}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-2.5 py-1 text-xs font-medium text-gray-600 transition-colors hover:border-gray-400 hover:text-gray-900"
        >
          {link.type === "map" ? (
            <MapPin className="h-3.5 w-3.5 text-rose-400" strokeWidth={2} />
          ) : (
            <Link2 className="h-3.5 w-3.5 text-gray-400" strokeWidth={2} />
          )}
          <span className="max-w-[10rem] truncate">{link.label}</span>
        </a>
      ))}
    </div>
  );
}
