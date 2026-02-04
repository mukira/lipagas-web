import './globals.css';

export const metadata = {
  title: 'Lipagas',
  description: 'Lipagas Web Store',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
