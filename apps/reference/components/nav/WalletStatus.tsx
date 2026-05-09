"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";

/**
 * Story 7.6 — `<WalletStatus />` placeholder.
 *
 * For Story 7.6 this component renders a static "Connect" button only.
 * Actual auth wiring is deferred to Story 7.9, which will:
 *
 *   - Story 7.9 (Privy + Wallet-Standard integration point):
 *       * Replace the placeholder click handler with `usePrivy().login()`.
 *       * Read `usePrivy().authenticated`, `user`, and the active linked
 *         wallet to render three states: not-connected | Privy email |
 *         Wallet-Standard wallet.
 *       * Wire a disconnect action via `usePrivy().logout()`.
 *       * Per NFR-S6, signing must flow through Wallet-Standard regardless
 *         of which provider Privy presents to the user.
 *
 * Until 7.9 lands, treat this file as the stable integration surface — the
 * component name and import path won't change.
 */
export function WalletStatus() {
  return (
    <Button
      type="button"
      variant="primary"
      size="sm"
      aria-label="Connect wallet"
      data-wallet-state="placeholder"
      // Story 7.9 will replace this no-op with usePrivy().login().
      onClick={() => {
        /* Story 7.9: wire Privy auth here. */
      }}
    >
      Connect
    </Button>
  );
}

export default WalletStatus;
