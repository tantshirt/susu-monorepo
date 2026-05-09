"use client";

import { NextIntlClientProvider } from "next-intl";
import type { ReactNode } from "react";

/**
 * Innermost provider in the locked chain. Story 7.7 wires real locale loading
 * and routing; for 7.1 we ship an English-only stub so the chain compiles.
 */
const messages: Record<string, string> = {
  "app.title": "Susu Reference App",
};

export function IntlProviderWrapper({ children }: { children: ReactNode }) {
  return (
    <NextIntlClientProvider locale="en" messages={messages} timeZone="UTC">
      {children}
    </NextIntlClientProvider>
  );
}
