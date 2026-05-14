import "./globals.css";

export const metadata = {
  title: "openvoxels.",
  description: "synthesis-based AI ensemble — 5 workers. 3 super AIs. one answer.",
  manifest: "/manifest.json",
  themeColor: "#080808",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "openvoxels.",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#080808" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="openvoxels." />
        <link rel="apple-touch-icon" href="/icon-192.png" />
      </head>
      <body>{children}</body>
    </html>
  );
}
