import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Palago",
  description: "PSE information for beginner Filipino investors",
};

type RootLayoutProps = {
  children: React.ReactNode;
};

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

