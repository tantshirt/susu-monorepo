"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import { useWallet } from "@/lib/wallet/useWallet";

export type AuthNavLink = Readonly<{
  href: string;
  label: string;
  requiresWallet?: boolean;
}>;

interface AuthNavLinksProps {
  links: readonly AuthNavLink[];
  className?: string;
  linkClassName?: string;
}

export function AuthNavLinks({ links, className, linkClassName }: AuthNavLinksProps) {
  const wallet = useWallet();
  const visibleLinks = links.filter((item) => wallet.connected || !item.requiresWallet);

  return (
    <div className={className} data-nav-links>
      {visibleLinks.map((item) => (
        <Link key={item.href} href={item.href} className={cn(linkClassName)}>
          {item.label}
        </Link>
      ))}
    </div>
  );
}
