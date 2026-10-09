import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'gamelog.gg — Tu Biblioteca y Podio Gamer Personal',
  description: 'Bitácora definitiva de videojuegos jugados, podio anual de honor y backlog organizado.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="dark">
      <body className="bg-[#08090d] text-slate-100 antialiased selection:bg-cyan-500/30 selection:text-cyan-200">
        <div className="fixed inset-0 bg-gamer-grid pointer-events-none opacity-40 z-0" />
        <div className="relative z-10 min-h-screen flex flex-col">
          {children}
        </div>
      </body>
    </html>
  );
}
