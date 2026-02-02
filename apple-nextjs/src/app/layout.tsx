import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "iPhone - Apple",
  description: "Designed for Apple Intelligence. Discover iPhone 17 Pro, iPhone Air, and iPhone 17, along with iPhone 16 and iPhone 16e.",
  openGraph: {
    title: "iPhone",
    description: "Designed for Apple Intelligence. Discover iPhone 17 Pro, iPhone Air, and iPhone 17, along with iPhone 16 and iPhone 16e.",
    url: "/iphone/",
    siteName: "Apple",
    locale: "en_US",
    type: "website",
    images: [
      {
        url: "/v/iphone/home/ci/images/meta/iphone__cud4q04omsuq_ogc80d.png",
      }
    ],
  },
  twitter: {
    site: "@Apple",
    card: "summary_large_image",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en-US" className="no-js" dir="ltr" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{
          __html: `
            document.documentElement.className = document.documentElement.className.replace('no-js', 'js');
          `
        }} />
        <link rel="stylesheet" type="text/css" href="/api-www/global-elements/global-header/v1/assets/globalheader.css" />
        <link rel="stylesheet" type="text/css" href="/ac/globalfooter/8/en_US/styles/ac-globalfooter.built.css" />
        <link rel="stylesheet" type="text/css" href="/ac/localnav/9/styles/ac-localnav.built.css" />
        <link rel="stylesheet" href="/wss/fonts5144.css" />
        <link rel="stylesheet" href="/v/ac/includes/campaigns-seasonal/vday-2026/a/built/styles/overview.built.css" type="text/css" />
        <link rel="stylesheet" href="/v/iphone/home/ci/built/styles/overview.built.css" type="text/css" />
        <link rel="stylesheet" href="/ac/ac-films/7.3.0/styles/modal.css" type="text/css" />
      </head>
      <body className="page-overview" data-component-list="FocusManager DeepLink">
        {children}
      </body>
    </html>
  );
}
