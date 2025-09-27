import type { Metadata } from "next";
import { Inter, DM_Serif_Display } from "next/font/google";
import { Analytics } from "@vercel/analytics/react";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: 'swap',
});

const dmSerif = DM_Serif_Display({
  variable: "--font-dm-serif",
  weight: '400',
  subsets: ["latin"],
  display: 'swap',
});

export const metadata: Metadata = {
  title: "Why, data, why?",
  description: "Ask questions about your data in plain English",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${inter.variable} ${dmSerif.variable} font-sans antialiased`}
      >
        {children}
        <Analytics />
      </body>
    </html>
  );
}
