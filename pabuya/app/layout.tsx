// base fonts and global styles
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Pabuya",
  description: "Performance-Based Creator Campaign Marketplace",
};

// keep body full width so every page locks to the exact same 448px frame
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full w-full bg-neutral-950">
        {/* global shake animation for invalid prompts and error states */}
        <style>{`
          @keyframes pabuya-shake {
            0%, 100% { transform: translateX(0); }
            15%, 45%, 75% { transform: translateX(-7px); }
            30%, 60%, 90% { transform: translateX(7px); }
          }
          .animate-shake {
            animation: pabuya-shake 0.42s cubic-bezier(0.36, 0.07, 0.19, 0.97) both;
          }
        `}</style>
        {children}
      </body>
    </html>
  );
}