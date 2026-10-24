import type { Metadata } from 'next';
import { Hanken_Grotesk } from 'next/font/google';
import './globals.css';

const hankenGrotesk = Hanken_Grotesk({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-hanken-grotesk',
});

export const metadata: Metadata = {
  title: 'Shipment tracking prototype',
  description: 'Frontend prototype for a shipment tracking product',
};

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="en" className={hankenGrotesk.variable}>
      <body className="min-h-screen bg-background text-body text-foreground">{children}</body>
    </html>
  );
}
