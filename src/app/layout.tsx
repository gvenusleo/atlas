import type { Metadata } from "next";
import { Geist_Mono, Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Atlas",
    template: "%s | Atlas",
  },
  description: "面向知识管理与 AI 协作的一体化平台。",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="zh-CN"
      suppressHydrationWarning
      className={`${inter.variable} ${geistMono.variable} light default h-full`}
      data-theme="light"
    >
      <body className="flex min-h-full flex-col bg-background text-foreground font-sans antialiased">
        {children}
      </body>
    </html>
  );
}
