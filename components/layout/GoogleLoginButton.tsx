"use client";

import Image from "next/image";
import { LogOut } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

function GoogleIcon() {
  return (
    <svg viewBox="0 0 48 48" className="h-4 w-4" aria-hidden="true">
      <path
        fill="#EA4335"
        d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
      />
      <path
        fill="#4285F4"
        d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.9-2.26 5.36-4.78 7.02l7.73 6c4.51-4.16 7.09-10.29 7.09-17.49z"
      />
      <path
        fill="#FBBC05"
        d="M10.53 28.59A14.5 14.5 0 0 1 9.5 24c0-1.59.27-3.13.76-4.59l-7.98-6.19A23.94 23.94 0 0 0 0 24c0 3.87.93 7.53 2.56 10.78z"
      />
      <path
        fill="#34A853"
        d="M24 48c6.48 0 11.92-2.14 15.89-5.82l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
      />
    </svg>
  );
}

export default function GoogleLoginButton() {
  const { user, loading, signInWithGoogle, signOut } = useAuth();

  const handleSignIn = async () => {
    try {
      await signInWithGoogle();
    } catch (error) {
      console.error("Googleログインに失敗しました", error);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error("ログアウトに失敗しました", error);
    }
  };

  if (loading) {
    return <div className="h-9 w-24 animate-pulse rounded-full bg-gray-200" />;
  }

  if (user) {
    return (
      <div className="flex items-center gap-2 rounded-full border border-gray-300 bg-white py-1 pl-1 pr-1.5 shadow-sm">
        <span className="relative h-7 w-7 shrink-0 overflow-hidden rounded-full bg-gray-100">
          {user.photoURL ? (
            <Image src={user.photoURL} alt="" fill sizes="28px" className="object-cover" />
          ) : (
            <span className="flex h-full w-full items-center justify-center text-xs font-semibold text-gray-500">
              {(user.displayName ?? user.email ?? "?").charAt(0).toUpperCase()}
            </span>
          )}
        </span>
        <span className="hidden max-w-[8rem] truncate text-sm font-medium text-gray-700 sm:inline">
          {user.displayName ?? user.email}
        </span>
        <button
          type="button"
          onClick={handleSignOut}
          className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
          aria-label="ログアウト"
        >
          <LogOut className="h-3.5 w-3.5" strokeWidth={2} />
        </button>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={handleSignIn}
      className="flex items-center gap-2 rounded-full border border-gray-300 bg-white px-3.5 py-2 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50 active:bg-gray-100"
    >
      <GoogleIcon />
      <span className="hidden sm:inline">Googleでログイン</span>
      <span className="sm:hidden">ログイン</span>
    </button>
  );
}
