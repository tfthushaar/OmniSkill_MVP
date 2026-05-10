import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Omni-Skill | Career Evidence for Digital-Native Talent",
  description: "Turn your gaming, esports, and community history into verified career proof. Evidence cards, resume bullets, and a shareable passport.",
  openGraph: {
    title: "Omni-Skill Career Graph",
    description: "Verified career evidence for digital-native students and esports participants.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
