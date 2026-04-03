"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import type { DrupalMenuLink } from "@/lib/drupal";

interface NavBarProps {
  links: DrupalMenuLink[];
}

export default function NavBar({ links }: NavBarProps) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <nav className="text-white" style={{ backgroundColor: "#0053a6" }}>
      <div className="max-w-6xl mx-auto px-4 flex items-center justify-between h-16">
        <Link href="/" className="text-xl font-bold tracking-tight hover:text-blue-200 transition-colors">
          Drupal + Next.js
        </Link>

        {/* Desktop nav */}
        <ul className="hidden md:flex gap-6 items-center">
          {links.map((link) => {
            const isActive = pathname === link.url || (link.url !== "/" && pathname.startsWith(link.url));
            return (
              <li key={link.id}>
                <Link
                  href={link.url}
                  className={`text-sm font-medium transition-colors hover:text-blue-200 pb-1 ${
                    isActive ? "border-b-2 border-white" : ""
                  }`}
                >
                  {link.title}
                </Link>
              </li>
            );
          })}
        </ul>

        {/* Mobile hamburger */}
        <button
          onClick={() => setOpen(!open)}
          className="md:hidden p-2 rounded hover:bg-blue-700 transition-colors"
          aria-label="Toggle navigation"
          aria-expanded={open}
        >
          <span className="block w-5 h-0.5 bg-white mb-1" />
          <span className="block w-5 h-0.5 bg-white mb-1" />
          <span className="block w-5 h-0.5 bg-white" />
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <ul className="md:hidden px-4 pb-4 space-y-2" style={{ backgroundColor: "#1e40af" }}>
          {links.map((link) => {
            const isActive = pathname === link.url;
            return (
              <li key={link.id}>
                <Link
                  href={link.url}
                  onClick={() => setOpen(false)}
                  className={`block py-2 text-sm font-medium hover:text-blue-200 transition-colors ${
                    isActive ? "text-blue-200 font-bold" : ""
                  }`}
                >
                  {link.title}
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </nav>
  );
}
