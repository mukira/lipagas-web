import './globals.css';
import IframeNavigationSync from './IframeNavigationSync';
import { Analytics } from '@vercel/analytics/react';

export const metadata = {
  title: 'LipaGas',
  description: 'The Operating System for Kenya\'s clean energy transition',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, padding: 0, overflow: 'hidden' }}>
        <IframeNavigationSync />
        {children}
        <Analytics />
      </body>
    </html>
  );
}
