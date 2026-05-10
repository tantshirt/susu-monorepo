"use client";

import * as React from "react";
import { usePrivy } from "@privy-io/react-auth";
import { Button, type ButtonProps } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useWallet } from "@/lib/wallet/useWallet";
import { cn } from "@/lib/utils";

/**
 * Story 7.9 — `<WalletStatus />`.
 *
 * Disconnected: a "Connect" button that opens Privy's login modal (email +
 * Wallet-Standard browser-extension fallback per FR39 / FR46).
 * Connected: a truncated address inside a shadcn `DropdownMenu` with a
 * "Disconnect" action that routes through Privy's `logout()`.
 *
 * Per NFR-R2 the component never assumes Privy is available — if `usePrivy`
 * throws (provider error) or login/logout aren't ready yet, the controls stay
 * inert instead of crashing.
 */
function truncateAddress(address: string): string {
  if (address.length <= 10) return address;
  return `${address.slice(0, 4)}...${address.slice(-4)}`;
}

export interface WalletStatusProps {
  /** Merged onto the trigger `<Button />` so callers can align nav typography. */
  className?: string;
  hideWhenDisconnected?: boolean;
  disconnectedLabel?: string;
  disconnectedAriaLabel?: string;
  disconnectedVariant?: ButtonProps["variant"];
}

export function WalletStatus({
  className,
  hideWhenDisconnected = false,
  disconnectedLabel = "Connect wallet",
  disconnectedAriaLabel,
  disconnectedVariant = "primary",
}: WalletStatusProps) {
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
    try {
      privy.logout();
    } catch {
      /* no-op */
    }
  }, [privy]);

  if (!connected || !address) {
    if (hideWhenDisconnected) {
      return null;
    }
    return (
      <Button
        type="button"
        variant={disconnectedVariant}
        size="sm"
        className={cn("text-sm font-medium", className)}
        aria-label={disconnectedAriaLabel ?? disconnectedLabel}
        data-wallet-state="disconnected"
        onClick={login}
      >
        {disconnectedLabel}
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
          className={cn("text-sm font-medium", className)}
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
