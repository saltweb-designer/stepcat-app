import EntryActions from "@/components/entry-form/EntryActions";
import type { EntryDoc } from "@/lib/types";

export default function MemoList({ memos }: { memos: EntryDoc[] }) {
  if (memos.length === 0) {
    return <p className="text-sm text-gray-400">まだメモがありません</p>;
  }

  return (
    <div className="flex flex-1 flex-col gap-2">
      {memos.map((memo) => (
        <div key={memo.id} className="flex items-start justify-between gap-2">
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-gray-600">
            {memo.detail || memo.title}
          </p>
          <EntryActions entry={memo} />
        </div>
      ))}
    </div>
  );
}
