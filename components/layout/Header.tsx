import Image from "next/image";
import Link from "next/link";
import GoogleLoginButton from "./GoogleLoginButton";
import HeaderNavIcons from "./HeaderNavIcons";

/** 猫 / StepCat / 動画 / 音楽 / アカウント の順に、どの幅でも1行に収める */
export default function Header() {
  return (
    <header
      className="sticky top-0 z-30 border-b border-gray-200 bg-white/80 backdrop-blur-md"
      style={{ paddingTop: "env(safe-area-inset-top)" }}
    >
      <div className="mx-auto flex max-w-2xl items-center justify-between gap-2 px-3 py-2.5 sm:gap-3 sm:px-6 sm:py-3">
        <Link href="/" className="flex min-w-0 items-center gap-1.5 sm:gap-2.5">
          <Image
            src="/logo_stepcat_icon.png"
            alt="StepCat"
            width={158}
            height={100}
            className="h-8 w-auto shrink-0 rounded-md sm:h-11"
            priority
          />
          <p className="truncate text-sm font-semibold text-gray-900">StepCat</p>
        </Link>
        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
          <HeaderNavIcons />
          <GoogleLoginButton />
        </div>
      </div>
    </header>
  );
}
