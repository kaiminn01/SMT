import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Emerge Intel · Social Intelligence Tool",
  description: "Grok-powered social media intelligence for Web3 growth teams",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
