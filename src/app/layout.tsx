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

function getMetadataBase() {
  const configuredUrl =
    process.env.NEXT_PUBLIC_SITE_URL ??
    "https://nexora-creative-gallery.vercel.app";

  try {
    return new URL(configuredUrl);
  } catch {
    return new URL("https://nexora-creative-gallery.vercel.app");
  }
}

export const metadata: Metadata = {
  metadataBase: getMetadataBase(),
  title: "Nexora Creative Gallery",
  description:
    "Galeri resmi karya pemenang event dan challenge Nexora.",
  openGraph: {
    type: "website",
    locale: "id_ID",
    siteName: "Nexora Creative Gallery",
    title: "Nexora Creative Gallery",
    description:
      "Galeri resmi karya pemenang event dan challenge Nexora.",
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
