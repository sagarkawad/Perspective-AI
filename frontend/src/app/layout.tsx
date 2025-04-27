import "./globals.css";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { RecoilRootProvider } from "./components/RecoilProvider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Perspective AI",
  description: "Discover Different Perspectives",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <RecoilRootProvider>{children}</RecoilRootProvider>
      </body>
    </html>
  );
}
