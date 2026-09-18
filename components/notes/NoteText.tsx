import { splitNoteText } from "@/lib/notes";

/** ノート本文を、URLをタップ可能なリンクとして描画しつつ、長文でもレイアウトが崩れないように表示する */
export default function NoteText({ text, className = "" }: { text: string; className?: string }) {
  const segments = splitNoteText(text);

  return (
    <p className={`min-w-0 whitespace-pre-wrap break-words text-sm leading-relaxed ${className}`}>
      {segments.map((segment, index) =>
        segment.isLink ? (
          <a
            key={index}
            href={segment.text}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="break-all text-blue-600 underline decoration-blue-300 underline-offset-2 hover:text-blue-700"
          >
            {segment.text}
          </a>
        ) : (
          <span key={index}>{segment.text}</span>
        )
      )}
    </p>
  );
}
