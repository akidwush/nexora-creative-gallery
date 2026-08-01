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
  title: {
    default: "Nexora Creative Gallery",
    template: "%s | Nexora Creative Gallery",
  },
  description:
    "Galeri resmi karya pemenang event dan challenge Nexora.",
  applicationName: "Nexora Creative Gallery",
  category: "design",
  openGraph: {
    type: "website",
    locale: "id_ID",
    siteName: "Nexora Creative Gallery",
    title: "Nexora Creative Gallery",
    description: "Galeri resmi karya pemenang event dan challenge Nexora.",
  },
  twitter: {
    card: "summary",
    title: "Nexora Creative Gallery",
    description: "Galeri resmi karya pemenang event dan challenge Nexora.",
  },
  icons: {
    icon: [{ url: "/nexora-logo-icon.jpg", type: "image/jpeg" }],
    shortcut: ["/nexora-logo-icon.jpg"],
    apple: [{ url: "/nexora-logo-icon.jpg", type: "image/jpeg" }],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="id"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
