import type { Metadata } from 'next';
import { Toaster } from 'sonner';
import './globals.css';

export const metadata: Metadata = {
  title: 'gamelog.gg — Track like a tryhard',
  description: 'Track like a tryhard — Tu biblioteca personal de videojuegos, podio anual de honor y backlog organizado.',
  openGraph: {
    title: 'gamelog.gg — Track like a tryhard',
    description: 'Track like a tryhard — Tu biblioteca personal de videojuegos, podio anual de honor y backlog organizado.',
    siteName: 'gamelog.gg',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'gamelog.gg — Track like a tryhard',
    description: 'Track like a tryhard — Tu biblioteca personal de videojuegos, podio anual de honor y backlog organizado.',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="dark">
      <body className="bg-[#141124] text-white antialiased selection:bg-[#6967EB]/30 selection:text-[#00CAFA]">
        <div className="min-h-screen flex flex-col bg-gradient-to-b from-[#19142e] via-[#141124] to-[#120e20]">
          {children}
        </div>
        <Toaster
          position="bottom-right"
          theme="dark"
          toastOptions={{
            style: {
              background: '#272041',
              border: '1px solid #352C56',
              color: '#FFFFFF',
              borderRadius: '1rem',
            },
          }}
        />
      </body>
    </html>
  );
}
