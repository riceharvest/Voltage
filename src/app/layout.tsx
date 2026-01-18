import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Voltage - DIY Soda Platform',
  description: 'Create your own soda and energy drinks safely.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
