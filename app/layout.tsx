import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Seamless Interactions Label Studio",
  description: "Annotation tool for Seamless Interactions dataset",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={inter.className}>
        <div className="h-screen flex flex-col bg-background text-foreground">
          <header className="border-b bg-card flex-shrink-0">
            <div className="container mx-auto px-4 py-4">
              <Link
                href="/"
                className="block hover:opacity-80 transition-opacity"
              >
                <h1 className="text-2xl font-bold">
                  Seamless Interactions Label Studio
                </h1>
              </Link>
            </div>
          </header>
          <main className="flex-1 overflow-hidden">{children}</main>
        </div>
      </body>
    </html>
  );
}
