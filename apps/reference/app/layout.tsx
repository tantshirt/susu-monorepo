import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { PrivyProviderWrapper } from "./providers/PrivyProviderWrapper";
import { ConvexProviderWrapper } from "./providers/ConvexProviderWrapper";
import { IntlProviderWrapper } from "./providers/IntlProviderWrapper";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Susu Reference App",
  description: "Reference UX surface for the Susu Protocol monorepo.",
};

/**
 * Locked provider order: PrivyProvider > ConvexProvider > IntlProvider > children.
 *
 * Privy is outermost so that Convex queries can read the authenticated identity
 * during hydration. Story 7.13 wires the real Convex schema; 7.7 wires real
 * locale routing.
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <PrivyProviderWrapper>
          <ConvexProviderWrapper>
            <IntlProviderWrapper>{children}</IntlProviderWrapper>
          </ConvexProviderWrapper>
        </PrivyProviderWrapper>
      </body>
    </html>
  );
}
