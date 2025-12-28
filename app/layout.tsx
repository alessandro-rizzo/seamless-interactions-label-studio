import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Link from "next/link";
import { Home } from "lucide-react";
import { auth } from "@/lib/auth";
import { UserMenu } from "@/components/user-menu";
import { MobileWarning } from "@/components/mobile-warning";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Seamless Interactions Label Studio",
  description: "Annotation tool for Seamless Interactions dataset",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();

  return (
    <html lang="en" className="dark">
      <body className={inter.className}>
        <MobileWarning />
        <div className="h-screen flex flex-col bg-background text-foreground">
          <header className="border-b bg-card flex-shrink-0">
            <div className="container mx-auto px-4 py-4 flex items-center justify-between">
              <Link
                href="/"
                className="block hover:opacity-80 transition-opacity"
              >
                <h1 className="text-2xl font-bold">
                  Seamless Interactions Label Studio
                </h1>
              </Link>
              {session?.user && (
                <div className="flex items-center gap-3">
                  <UserMenu user={session.user} />
                  <Link
                    href="/"
                    className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary transition-colors"
                    title="Back to video list"
                  >
                    <Home size={18} />
                  </Link>
                </div>
              )}
            </div>
          </header>
          <main className="flex-1 overflow-hidden">{children}</main>
        </div>
      </body>
    </html>
  );
}
