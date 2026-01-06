import React from 'react';
import { Inter } from 'next/font/google';
import './globals.css'; // Si tienes estilos globales

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'Recap - Revive tus jugadas',
  description: 'Sistema inteligente para capturar tus mejores momentos en la cancha',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <head />
      <body className={inter.className}>
        {children} {/* Aquí se renderiza el contenido de tus páginas */}
      </body>
    </html>
  );
}
