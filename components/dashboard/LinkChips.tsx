import { Link2, MapPin } from "lucide-react";
import { detectLinkType } from "@/lib/build-week-entries";
import EntryActions from "@/components/entry-form/EntryActions";
import type { EntryDoc } from "@/lib/types";

export default function LinkChips({ links }: { links: EntryDoc[] }) {
  if (links.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1.5">
      {links.map((link) => {
        const type = detectLinkType(link.link);
        return (
          <div
            key={link.id}
            className="flex items-center gap-0.5 rounded-full border border-gray-200 bg-white py-1 pl-2.5 pr-1 text-xs font-medium text-gray-600"
          >
            <a
              href={link.link}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 transition-colors hover:text-gray-900"
            >
              {type === "map" ? (
                <MapPin className="h-3.5 w-3.5 shrink-0 text-rose-400" strokeWidth={2} />
              ) : (
                <Link2 className="h-3.5 w-3.5 shrink-0 text-gray-400" strokeWidth={2} />
              )}
              <span className="max-w-[8rem] truncate">{link.title || link.link}</span>
            </a>
            <EntryActions entry={link} className="flex shrink-0 items-center gap-0.5" />
          </div>
        );
      })}
    </div>
  );
}
