"use client";

import * as React from "react";
import { usePrivy } from "@privy-io/react-auth";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { disconnectWalletStandardWallet, useWallet } from "@/lib/wallet/useWallet";

/**
 * Story 7.9 — `<WalletStatus />`.
 *
 * Disconnected: a "Connect" button that opens Privy's login modal (email +
 * Wallet-Standard browser-extension fallback per FR39 / FR46).
 * Connected: a truncated address inside a shadcn `DropdownMenu` with a
 * "Disconnect" action for the active provider.
 *
 * Per NFR-R2 the component never assumes Privy is available — if `usePrivy`
 * throws (provider error) or login/logout aren't ready yet, the controls stay
 * inert instead of crashing.
 */
function truncateAddress(address: string): string {
  if (address.length <= 10) return address;
  return `${address.slice(0, 4)}...${address.slice(-4)}`;
}

export function WalletStatus() {
  const { connected, address, provider } = useWallet();
  const privy = usePrivy();
  // Wrap action calls so an unexpected throw at click-time can't crash the
  // nav (NFR-R2). The hook itself is called unconditionally per
  // rules-of-hooks; PrivyProviderWrapper is the locked outermost provider.
  const login = React.useCallback(() => {
    try {
      privy.login();
    } catch {
      /* no-op — see NFR-R2 */
    }
  }, [privy]);
  const logout = React.useCallback(() => {
    if (provider === "wallet-standard" && address) {
      disconnectWalletStandardWallet(address);
      return;
    }

    try {
      void privy.logout().catch(() => {
        /* no-op */
      });
    } catch {
      /* no-op */
    }
  }, [address, privy, provider]);

  if (!connected || !address) {
    return (
      <Button
        type="button"
        variant="primary"
        size="sm"
        aria-label="Connect wallet"
        data-wallet-state="disconnected"
        onClick={login}
      >
        Connect
      </Button>
    );
  }

  const label = truncateAddress(address);
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          aria-label={`Wallet ${label} (${provider ?? "unknown"})`}
          data-wallet-state="connected"
          data-wallet-provider={provider ?? "unknown"}
        >
          <span className="font-mono">{label}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[10rem]">
        <DropdownMenuItem
          onSelect={(e) => {
            e.preventDefault();
            logout();
          }}
          aria-label="Disconnect wallet"
          data-action="disconnect"
        >
          Disconnect
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default WalletStatus;
