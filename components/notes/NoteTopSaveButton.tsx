import type { NoteFormStatus } from "./NoteInlineForm";

/** ノート入力中、カード右上に出す保存ボタン。下の保存ボタンまでスクロールしなくても保存できるようにする */
export default function NoteTopSaveButton({
  formId,
  status,
  label,
}: {
  formId: string;
  status: NoteFormStatus;
  label: string;
}) {
  return (
    <button
      type="submit"
      form={formId}
      disabled={!status.canSubmit}
      className="shrink-0 rounded-full bg-black px-4 py-1.5 text-sm font-medium text-white transition-colors hover:bg-gray-800 disabled:cursor-not-allowed disabled:bg-gray-300"
    >
      {status.saving ? "保存中..." : label}
    </button>
  );
}
