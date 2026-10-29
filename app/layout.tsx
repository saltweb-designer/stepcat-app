import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { AuthProvider } from "@/contexts/AuthContext";
import AppChrome from "@/components/layout/AppChrome";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// ファビコンを更新した際は、ブラウザの強いキャッシュを回避するためこのバージョン番号を上げてください
const FAVICON_VERSION = "4";

export const metadata: Metadata = {
  title: "StepCat",
  description: "目標管理・タスク消化型の日記・カレンダーアプリ",
  icons: {
    icon: [{ url: `/favicon.png?v=${FAVICON_VERSION}`, type: "image/png" }],
    shortcut: [{ url: `/favicon.png?v=${FAVICON_VERSION}`, type: "image/png" }],
    apple: [{ url: `/apple-icon.png?v=${FAVICON_VERSION}`, type: "image/png" }],
  },
};

// iPad・iPhoneのSafariでは画面の端までページが描かれるため、cover指定でセーフエリアの値（env(safe-area-inset-*)）を受け取り、
// ヘッダー・フッター側でその分の余白を取る。指定しないと値が0になり、フッターがホームバーの裏にめり込む
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="ja"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      {/*
        ページ全体(window)をスクロールさせると、iPad・iPhoneのSafariがツールバーを出し入れする際に
        固定表示のヘッダー・フッターが上下にずれて画面外へめり込むことがある。
        画面の高さに固定した枠の中だけをスクロールさせ、フッターは枠の下に普通に並べる
      */}
      <body className="flex h-dvh flex-col overflow-hidden bg-gray-100">
        <AuthProvider>
          <div data-scroll-root className="min-h-0 flex-1 overflow-y-auto overscroll-contain">{children}</div>
          <AppChrome />
        </AuthProvider>
      </body>
    </html>
  );
}
