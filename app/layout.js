import "./globals.css";

export const metadata = {
  title: "openvoxels.",
  description: "synthesis-based AI ensemble — 5 workers. 3 super AIs. one answer.",
  viewport: "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
