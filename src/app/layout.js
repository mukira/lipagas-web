import './globals.css';

export const metadata = {
  title: 'Lipagas',
  description: 'Lipagas Web Store',
  icons: {
    icon: '/favicon.png', // /public/favicon.png
    apple: '/favicon.png',
  },
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
