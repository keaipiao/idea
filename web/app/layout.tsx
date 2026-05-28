import type { Metadata } from "next";
import { Noto_Sans_SC } from "next/font/google";
import "./globals.css";
import { ToastProvider } from "./_components/ToastProvider";
import { ModalRoot } from "./_components/ModalRoot";

// PR-3 ADR-22:Noto Sans SC self-host(跨平台一致)
const notoSC = Noto_Sans_SC({
  variable: "--font-noto-sc",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "IdeaBox",
  description: "像发微信一样记想法,但有项目归属、有完成状态",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" className={`${notoSC.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        <ToastProvider>
          <ModalRoot>{children}</ModalRoot>
        </ToastProvider>
      </body>
    </html>
  );
}
