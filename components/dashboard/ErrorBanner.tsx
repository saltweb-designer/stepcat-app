import { AlertTriangle } from "lucide-react";

export default function ErrorBanner({ message }: { message: string }) {
  return (
    <div className="flex items-start gap-2 rounded-2xl bg-rose-50 p-3.5 text-sm text-rose-700 shadow-sm">
      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={2} />
      <p>{message}</p>
    </div>
  );
}
