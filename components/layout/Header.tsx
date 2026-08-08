import Image from "next/image";
import Link from "next/link";
import GoogleLoginButton from "./GoogleLoginButton";

export default function Header() {
  return (
    <header className="sticky top-0 z-30 border-b border-gray-200 bg-white/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-2xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <Link href="/" className="flex items-center gap-2.5">
          <Image
            src="/logo_stepcat_icon.png"
            alt="StepCat"
            width={158}
            height={100}
            className="h-10 w-auto rounded-md sm:h-11"
            priority
          />
          <div className="leading-tight">
            <p className="text-sm font-semibold text-gray-900">StepCat</p>
            <p className="text-xs text-gray-500">目標管理・タスク消化型日記</p>
          </div>
        </Link>
        <GoogleLoginButton />
      </div>
    </header>
  );
}
