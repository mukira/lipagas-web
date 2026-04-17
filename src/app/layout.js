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
        <footer style={{ position: 'absolute', width: '1px', height: '1px', padding: 0, margin: '-1px', overflow: 'hidden', clip: 'rect(0, 0, 0, 0)', border: 0 }}>
          <a href="/privacy-policy">Privacy Policy</a>
        </footer>
      </body>
    </html>
  );
}
