"use client";

import Image from "next/image";
import { LogIn } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

export default function LoginPrompt() {
  const { signInWithGoogle } = useAuth();

  const handleSignIn = async () => {
    try {
      await signInWithGoogle();
    } catch (error) {
      console.error("Googleログインに失敗しました", error);
    }
  };

  return (
    <div className="flex flex-col items-center gap-4 rounded-2xl bg-white p-8 text-center shadow-sm sm:p-12">
      <div className="relative h-20 w-24">
        <Image src="/home_ai.png" alt="" fill sizes="96px" className="object-contain object-bottom" />
      </div>
      <div>
        <p className="text-base font-bold text-gray-900">StepCatへようこそ</p>
        <p className="mt-1.5 max-w-xs text-sm leading-relaxed text-gray-500">
          週の目標や日々のタスク、日記を記録するには
          <br />
          Googleアカウントでログインしてください。
        </p>
      </div>
      <button
        type="button"
        onClick={handleSignIn}
        className="flex items-center gap-2 rounded-full bg-black px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-gray-800"
      >
        <LogIn className="h-4 w-4" strokeWidth={2} />
        Googleでログイン
      </button>
    </div>
  );
}
