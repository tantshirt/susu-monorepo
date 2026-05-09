"use client";

import { PrivyProvider } from "@privy-io/react-auth";
import type { ReactNode } from "react";
import { env } from "@/lib/env";

/**
 * Outermost provider in the locked chain
 * (PrivyProvider > ConvexProvider > IntlProvider > children).
 *
 * Privy must hydrate auth state before Convex mounts so Convex queries can
 * read the authenticated identity at first paint. See apps/reference/README.md
 * for the rationale.
 */
export function PrivyProviderWrapper({ children }: { children: ReactNode }) {
  return (
    <PrivyProvider
      appId={env.NEXT_PUBLIC_PRIVY_APP_ID}
      config={{
        loginMethods: ["email", "wallet"],
        embeddedWallets: { createOnLogin: "users-without-wallets" },
      }}
    >
      {children}
    </PrivyProvider>
  );
}
