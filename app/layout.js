// app/layout.js
import "./globals.css";

export const metadata = {
  title: "openvoxels.",
  description: "synthesis-based AI ensemble",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
    <body>{children}</body>
    </html>
  );
}
