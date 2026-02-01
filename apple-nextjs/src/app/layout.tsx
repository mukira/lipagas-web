import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "iPhone - Apple",
  description: "Explore the iPhone lineup. Compare models, find the right iPhone for you, and more.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        {/* Core global Apple styles available on all pages */}
        <link rel="stylesheet" href="/api-www/global-elements/global-header/v1/assets/globalheader.css" />
        <link rel="stylesheet" href="/ac/globalfooter/8/en_US/styles/ac-globalfooter.built.css" />
        <link rel="stylesheet" href="/ac/localnav/9/styles/ac-localnav.built.css" />
        <link rel="stylesheet" href="/wss/fonts/fonts.css" />
        <link rel="stylesheet" href="/icon-fixes.css" />
      </head>
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
