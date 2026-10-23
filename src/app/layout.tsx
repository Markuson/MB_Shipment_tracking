import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Shipment tracking prototype',
  description: 'Frontend prototype for a shipment tracking product',
};

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="en">
      <body className="bg-background text-foreground min-h-screen">{children}</body>
    </html>
  );
}
