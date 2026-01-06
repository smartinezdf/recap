"use client";

import { useState } from "react";

export function Nav() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-zinc-200/60 bg-white/70 backdrop-blur">
        <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          {/* Logo */}
          <a href="/" className="flex items-center gap-3">
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-black text-white text-[13px] font-semibold">
              R
            </span>
            <span className="font-semibold tracking-tight">Replay</span>
          </a>

          {/* Desktop menu */}
          <ul className="hidden md:flex items-center gap-8 text-sm text-zinc-600">
            <li>
              <a href="/#que-es" className="hover:text-zinc-900 transition">
                Qué es
              </a>
            </li>
            <li>
              <a href="/#clubs" className="hover:text-zinc-900 transition">
                Clubs
              </a>
            </li>
            <li>
              <a href="/#clips" className="hover:text-zinc-900 transition">
                Ver clips
              </a>
            </li>
            <li>
              <a href="/#faq" className="hover:text-zinc-900 transition">
                FAQ
              </a>
            </li>
          </ul>

          {/* Hamburger (mobile) */}
          <button
            onClick={() => setOpen(true)}
            className="md:hidden flex flex-col gap-1.5"
            aria-label="Abrir menú"
          >
            <span className="h-0.5 w-6 bg-black" />
            <span className="h-0.5 w-6 bg-black" />
            <span className="h-0.5 w-6 bg-black" />
          </button>
        </nav>
      </header>

      {/* Mobile menu */}
      {open && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm">
          {/* Click fuera para cerrar */}
          <button
            className="absolute inset-0 h-full w-full"
            onClick={() => setOpen(false)}
            aria-label="Cerrar menú"
          />

          <div className="absolute right-0 top-0 h-full w-4/5 max-w-sm bg-white p-6">
            <div className="flex items-center justify-between">
              <span className="font-semibold">Replay</span>
              <button
                onClick={() => setOpen(false)}
                className="text-xl"
                aria-label="Cerrar menú"
              >
                ✕
              </button>
            </div>

            <ul className="mt-10 flex flex-col gap-6 text-lg font-medium">
              <li>
                <a href="/#que-es" onClick={() => setOpen(false)}>
                  Qué es
                </a>
              </li>
              <li>
                <a href="/#clubs" onClick={() => setOpen(false)}>
                  Clubs
                </a>
              </li>
              <li>
                <a href="/#clips" onClick={() => setOpen(false)}>
                  Ver clips
                </a>
              </li>
              <li>
                <a href="/#faq" onClick={() => setOpen(false)}>
                  FAQ
                </a>
              </li>
            </ul>
          </div>
        </div>
      )}
    </>
  );
}
