import type { Metadata } from "next";
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

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="ja"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <AuthProvider>
          {children}
          <AppChrome />
        </AuthProvider>
      </body>
    </html>
  );
}
