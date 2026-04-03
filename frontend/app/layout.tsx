import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import NavBar from "@/components/NavBar";
import { getMenuLinks, rewriteMenuLinks, type DrupalMenuLink } from "@/lib/drupal";

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
    template: "%s | Drupal + Next.js",
    default: "Drupal + Next.js Showcase",
  },
  description:
    "A decoupled Drupal CMS front-end built with Next.js 15, showcasing headless CMS architecture via JSON:API.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  let menuLinks: DrupalMenuLink[] = [];
  try {
    menuLinks = await rewriteMenuLinks(await getMenuLinks());
  } catch {
    // Drupal may not be reachable during build
    menuLinks = [];
  }

  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen flex flex-col bg-gray-50`}
      >
        <header className="sticky top-0 z-50 shadow-md">
          <NavBar links={menuLinks} />
        </header>

        <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-8">
          {children}
        </main>

        <footer className="bg-gray-800 text-gray-300 mt-auto">
          <div className="max-w-6xl mx-auto px-4 py-6 flex flex-col md:flex-row items-center justify-between gap-2 text-sm">
            <p>
              Powered by{" "}
              <a
                href="https://www.drupal.org"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:underline"
              >
                Drupal
              </a>{" "}
              +{" "}
              <a
                href="https://nextjs.org"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:underline"
              >
                Next.js
              </a>
            </p>
            <p className="text-gray-500 text-xs">
              A headless CMS showcase — content served via JSON:API
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
