import type React from "react";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "College Wishlist | Modern Photo Booth Experience",
  description:
    "Create stunning photo memories with advanced filters, modern design, and instant sharing. The ultimate photo booth experience for your special moments.",
  keywords: [
    "photo booth",
    "filters",
    "camera",
    "memories",
    "college",
    "photos",
    "instant",
  ],
  authors: [{ name: "Suraj Acharya" }],
  generator: "Next.js",
  viewport: "width=device-width, initial-scale=1",
  themeColor: "#8b5cf6",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
