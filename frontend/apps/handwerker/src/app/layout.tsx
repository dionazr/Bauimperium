import type { Metadata } from 'next';
import '../styles/globals.css';

export const metadata: Metadata = {
  title: 'Bauimperium Handwerker - Ihr SaaS-Dashboard',
  description: 'KI-gestützte Angebotserstellung, GoBD-konforme Rechnungen und Projektverwaltung für Handwerksbetriebe.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="de" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
