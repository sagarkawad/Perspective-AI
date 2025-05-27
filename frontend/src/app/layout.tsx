import "./globals.css";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { RecoilRootProvider } from "./components/RecoilProvider";
import {
  ClerkProvider,
  SignInButton,
  SignUpButton,
  SignedIn,
  SignedOut,
  UserButton,
} from "@clerk/nextjs";
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
    <ClerkProvider>
      {" "}
      <html lang="en">
        <body className={inter.className}>
          <RecoilRootProvider>
            {" "}
            <header className="flex justify-end items-center p-4 gap-4 h-16">
              <SignedOut>
                <SignInButton />
                <SignUpButton />
              </SignedOut>
              <SignedIn>
                <UserButton />
              </SignedIn>
            </header>
            {children}
          </RecoilRootProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
