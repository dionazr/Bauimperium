import type { Metadata } from 'next';
import { Providers } from './providers';
import '../styles/globals.css';

export const metadata: Metadata = {
  title: 'Bauimperium - Der Premium Bau-Marktplatz',
  description: 'Sicher bauen mit Treuhandkonto, KI-Prüfung und geprüften Handwerkern. Ihr Bauprojekt in besten Händen.',
  keywords: ['Bau', 'Handwerker', 'Renovierung', 'Neubau', 'Sanierung', 'Bauimperium', 'Treuhand'],
  openGraph: {
    title: 'Bauimperium - Der Premium Bau-Marktplatz',
    description: 'Sicher bauen mit Treuhandkonto. Geprüfte Handwerker, KI-gestützte Qualitätskontrolle.',
    type: 'website',
    locale: 'de_DE',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="de" suppressHydrationWarning>
      <body className="min-h-screen">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
