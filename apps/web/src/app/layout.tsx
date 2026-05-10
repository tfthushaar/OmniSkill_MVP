import type { Metadata } from "next";
import { Rajdhani, Share_Tech_Mono, Barlow_Condensed } from "next/font/google";
import "./globals.css";

const rajdhani = Rajdhani({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-body",
  display: "swap",
});

const shareTechMono = Share_Tech_Mono({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-mono",
  display: "swap",
});

const barlowCondensed = Barlow_Condensed({
  subsets: ["latin"],
  weight: ["400", "700", "900"],
  style: ["normal", "italic"],
  variable: "--font-head",
  display: "swap",
});

export const metadata: Metadata = {
  title: "OMNI-SKILL // Career Graph",
  description: "A data-backed career evidence platform. Turn gaming, esports, and community activity into verified professional proof.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body className={`${rajdhani.variable} ${shareTechMono.variable} ${barlowCondensed.variable} min-h-full flex flex-col antialiased`}>
        {children}
      </body>
    </html>
  );
}
